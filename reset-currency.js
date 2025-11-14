// Reset Currency Script
// This script will help you change the currency from DA to EGP

const Datastore = require('nedb');
const path = require('path');

// Database path
const dbPath = process.env.APPDATA + "/POS/server/databases/settings.db";

console.log("Database location:", dbPath);
console.log("\n=== Currency Reset Script ===\n");

let settingsDB = new Datastore({
    filename: dbPath,
    autoload: true
});

// Check current settings
settingsDB.findOne({ _id: 1 }, function (err, docs) {
    if (err) {
        console.error("Error reading database:", err);
        return;
    }

    if (!docs) {
        console.log("No settings found in database. Settings will be created when you first configure the app.");
        console.log("Default currency is now set to: EGP");
    } else {
        console.log("Current settings found:");
        console.log("Current Currency Symbol:", docs.settings ? docs.settings.symbol : "Not set");
        
        // Update currency to EGP
        if (docs.settings) {
            docs.settings.symbol = "EGP";
            
            settingsDB.update({ _id: 1 }, docs, {}, function (err, numReplaced) {
                if (err) {
                    console.error("Error updating currency:", err);
                } else {
                    console.log("\n✓ Currency successfully updated to: EGP");
                    console.log("Changes saved! Restart the application to see the changes.");
                }
                process.exit(0);
            });
        }
    }
});

