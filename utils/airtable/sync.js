exports = module.exports = exports = module.exports = function() {
  var mod = {
    records: async function(callbacks, configKey, sourceRecords, records, itemKey, table, fields) {
      if (typeof itemKey === "string") {
        var str = itemKey;
        itemKey = {left: str, right: str};
      };
      if (!app.has(sourceRecords)) sourceRecords = {};
      var i = 0;
      for (sourceKey in sourceRecords) {
        var sourceRecord = sourceRecords[sourceKey];
        if (app.has(callbacks.sourceRecord)) {
          var pRecord = sourceRecord;
          sourceRecord = await callbacks.sourceRecord(sourceRecord);
          if (sourceRecord === false) continue;
          if (!app.has(sourceRecord)) sourceRecord = pRecord;
        }
        var record = app.utils.object.exists(records, itemKey.right, sourceRecord[itemKey.left]);
        var method = "PATCH";
        if (app.has(record)) {
          record = JSON.parse(JSON.stringify(record));
          record.fields = {};
          for (var key in record) {
            if (key !== "id" && key !== "fields") {
              record.fields[key] = record[key];
              delete record[key];
            }
          }
        }
        var oRecord = app.has(record) ? JSON.parse(JSON.stringify(record)) : undefined;
        if (!app.has(record)) {
          method = "POST";
          record = {fields: {}};
        }
        for (var f=0; f<=fields.length-1; f++) record.fields[fields[f]] = sourceRecord[fields[f]];
        for (var key in record.fields) {
          if (fields.indexOf(key) < 0) delete record.fields[key];
        }
        record.fields[itemKey.right] = sourceRecord[itemKey.left];
        var changed = undefined;
        if (app.has(oRecord)) changed = app.utils.object.changed(sourceRecord, oRecord.fields, Object.keys(record.fields), [itemKey.right]);
        if (!app.has(oRecord) || app.has(changed)) {
          if (app.has(changed)) {
            console.log("CHANGED: " + sourceRecord[itemKey.left] + ": " + changed);
            if (app.has(sourceRecord.Status)) {
              delete record.fields.Status;
              if (changed.toLowerCase() === "status") {
                console.log("(" + (i + 1) + "/" + Object.keys(sourceRecords).length + ") " +  table + " skipped status: " + sourceRecord[itemKey.left]);
                continue;
              }
            }
          } else {
            console.log("NEW: " + sourceRecord[itemKey.left]);
          }
          if (app.has(record.createdTime)) delete record.createdTime;
          var {result, error} = await app.api.airtable.request("result", function(json, page) {}, table, "Grid view", [], method, {records: [record]}, undefined, undefined, configKey);
          if (!error) {
            console.log("(" + (i + 1) + "/" + Object.keys(sourceRecords).length + ") " +  table + " updated: " + sourceRecord[itemKey.left]);
            if (app.has(callbacks.updateRecord)) {
              await callbacks.updateRecord(result);
            }
          } else {
            console.log("(" + (i + 1) + "/" + Object.keys(sourceRecords).length + ") " +  "Could not update " + table + ": " + sourceRecord[itemKey.left], error);
          }
        } else {
          console.log("(" + (i + 1) + "/" + Object.keys(sourceRecords).length + ") " +  "Skipped " + table + " update to Airtable: " + sourceRecord[itemKey.left]);
        }
        i += 1;
        // if (i === 0) break;
      }
    }
  };
  return mod;
}