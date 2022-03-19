let db;

// establish connection to IndexedDB database called 'transaction_hunt' an set it to version 1
const request = indexedDB.open("budget_tracker", 1);

// this will emit if the database version changes (nonexistant to 1, v1 to v2,etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the databse
  const db = event.target.result;
  // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_transaction", { autoIncrement: true });

  // upon successful
};
request.onsuccess = function (event) {
  // when db is succesfully created with its object store (from onupgradedneeded event above) or simplt established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadTransaction() function to send all local db data to the api
  if (navigator.onLine) {
    // we haven't created this yet, but we will soon, so let's comment it out for now
    uploadNewTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object to store for `new_transaction`
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  transactionObjectStore.add(record);
}
    
function uploadNewTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access your object store
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all recoreds from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let;s send it to the api server
    if (getAll.result.length > 0) { 
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          // if (serverResponse.message) {
          //   throw new Error(serverResponse);
          // }
          // open one more transaction

          const transaction = db.transaction(["new_transaction"], "readwrite");
          const transactionObjectStore = transaction.objectStore('new_transaction');
          transactionObjectStore.clear();
          alert("All saved transaction has been submitted");

        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadNewTransaction);
