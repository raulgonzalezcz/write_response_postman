// Import package csvjson
const csvjson = require('csvjson');
  
// Import fs package(file system) 
// for read and write files
const fs = require('fs');
const readFile = fs.readFile;
const writeFile = fs.writeFile;
  
// Reading json file(filename -data.json)
readFile('./response.json', 'utf-8', (err, fileContent) => {
    if (err) {
        // Doing something to handle the error or just throw it
        console.log(err); 
        throw new Error(err);
    }
  
    // Convert json to csv function
    const csvData = csvjson.toCSV(fileContent, {
        headers: 'key'
    });
  
    // Write data into csv file named college_data.csv
    writeFile('./response.csv', csvData, (err) => {
        if(err) {
            // Do something to handle the error or just throw it
            console.log(err); 
            throw new Error(err);
        }
        console.log('Data stored into csv file successfully');
    });
});