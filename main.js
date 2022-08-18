// Import package csvjson
const csvjson = require("csvjson");

// Import fs package(file system)
// for read and write files
const fs = require("fs");
const readFile = fs.readFile;
const writeFile = fs.writeFile;

// Perform HTTP requests (example from Postman).
const axios = require("axios");

// Initial setup for queries. We define the url on each iteration
const config = {
  method: "get",
  headers: {
    Authorization:
      "Basic ODNhZDVjY2U5MTljN2ZkYjAyZjY0NDNlYmMyMTM4Zjc0Njk3ZjFlNTo=",
  },
};

// We start from page 1
let current_page = 1;
const MAX_INVITATIONS_PER_PAGE = 100;
url = `https://api.checkr.com/v1/invitations?status=expired&page=${current_page}&per_page=${MAX_INVITATIONS_PER_PAGE}`;
config.url = url;

// Get information (email, phone) if provided by API
const getCandidateInfo = async (candidate_id) => {
  const config = {
    method: "get",
    url: `https://api.checkr.com/v1/candidates/${candidate_id}`,
    headers: {
      Authorization:
        "Basic ODNhZDVjY2U5MTljN2ZkYjAyZjY0NDNlYmMyMTM4Zjc0Njk3ZjFlNTo=",
    },
  };

  // Try to get email and phone number
  const response = await axios(config)
    .then((response) => {
      //console.log(`Retrieving candidate ${candidate_id}...`);
      return response;
    })
    .then(function (response) {
      return { email: response.data.email, phone: response.data.phone };
    })
    // For some reasons, the API returns an error on the candidate
    .catch(function (error) {
      console.log(`Error retrieving candidate ${candidate_id}: ${error}`);
      return { email: "", phone: "" };
    });
  //Return object {email, phone}
  return response;
};

const getDataFromInvite = async (response) => {
  // Get 100 invitations from page N
  const new_invitations = response.data.data.map(async (record) => {
    // Try to append email and phone
    const candidate_info = await getCandidateInfo(record.candidate_id);
    record["email"] = candidate_info.email;
    record["phone"] = candidate_info.phone;
    return record;
  });

  const final_promise = await Promise.all(new_invitations).then((res) => {
    return res;
  });
  return final_promise;
};

const getDataFromPage = async (pages) => {
  // Get 100 invitations from page N
  const new_invitations = pages.map(async (page) => {
    // Try to append email and phone
    const data = await getInvitations(page);
    return data;
  });

  const final_promise = await Promise.all(new_invitations).then((res) => {
    console.log(`List complete!`);
    return res;
  });
  return final_promise;
};

const getInvitations = async (current_page) => {
  url = `https://api.checkr.com/v1/invitations?status=expired&page=${current_page}&per_page=${MAX_INVITATIONS_PER_PAGE}`;
  config.url = url;
  const response = await axios(config)
    .then((response) => {
      console.log(`Retrieving page ${current_page}...`);
      return response;
    })
    .then(function (response) {
      // Get 100 invitations from page N
      const new_invitations = getDataFromInvite(response);
      new_invitations.then((response) => {
        console.log(`${response.length} invitations in page ${current_page}`);
      });
      return new_invitations;
    })
    .catch(function (error) {
      console.log(`Error retrieving page ${current_page}: ${error}`);
      return [];
    });
  return response;
};

/**
 * Issue: We just get 100 invitations per page (and this is the limit on the query)
 * So we need to perform multiple queries to reach the total amount of expired invitations
 */
// First we need to get the total amount of expired invitations
const startProcess = async () => {
  const data_as_json = [];
  const response = axios(config)
    .then(function (response) {
      const total_invitations = response.data.count;
      console.log(`No. invitations: ${total_invitations}`);
      return total_invitations;
    })
    .then((total_invitations) => {
      // Get 100 invitations per page
      const pages = Math.ceil(total_invitations / MAX_INVITATIONS_PER_PAGE);
      console.log(`Total pages: ${pages}`);
      const array_pages = Array(pages)
        .fill()
        .map((e, i) => i + 1);

      const final_data = getDataFromPage(array_pages);
      final_data.then((data_per_page) => {
        console.log(`Total pages generated: ${data_per_page.length}`);
        const new_object = { data: [] };
        // Create flatten array
        new_object.data = [].concat.apply([], data_per_page);
        console.log(new_object.data[5]);
        // Save to file (so we depend on memory)
        let data = JSON.stringify(new_object.data);
        fs.writeFileSync("response.json", data);

        // Generate CSV file
        // Reading json file(filename -data.json)
        readFile("./response.json", "utf-8", (err, fileContent) => {
          if (err) {
            // Doing something to handle the error or just throw it
            console.log(err);
            throw new Error(err);
          }

          // Convert json to csv function
          const csvData = csvjson.toCSV(fileContent, {
            headers: "key",
          });

          // Write data into csv file named college_data.csv
          writeFile("./response.csv", csvData, (err) => {
            if (err) {
              // Do something to handle the error or just throw it
              console.log(err);
              throw new Error(err);
            }
            console.log("Data stored into csv file successfully");
          });
        });
      });
    })
    .catch(function (error) {
      console.log(
        `Error getting total amount of expired invitations: ${error}`
      );
      return [];
    });
};

// Execute program
const new_job = startProcess();
