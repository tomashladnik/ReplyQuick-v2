import Airtable from 'airtable';

// Initialize Airtable
let base = null;
try {
  if (process.env.NEXT_AIRTABLE_API_KEY && process.env.NEXT_AIRTABLE_BASE_ID) {
    console.log('Initializing Airtable with:');
    console.log('API Key:', process.env.NEXT_AIRTABLE_API_KEY.substring(0, 10) + '...');
    console.log('Base ID:', process.env.NEXT_AIRTABLE_BASE_ID);
    
    const airtable = new Airtable({ apiKey: process.env.NEXT_AIRTABLE_API_KEY });
    base = airtable.base(process.env.NEXT_AIRTABLE_BASE_ID);
    
    // Test the connection and log table schema
    base('Email').select({
      maxRecords: 1,
      view: "Grid view"
    }).firstPage(function(err, records) {
      if (err) {
        console.error('Error testing Airtable connection:', err);
        if (err.statusCode === 403) {
          console.error('This might be because:');
          console.error('1. The API key doesn\'t have access to this base');
          console.error('2. The base ID is incorrect');
          console.error('3. The table name is incorrect');
        }
        return;
      }
      if (records && records.length > 0) {
        console.log('Successfully connected to Airtable');
        console.log('Available fields:', Object.keys(records[0].fields));
        console.log('Sample record:', records[0].fields);
      } else {
        console.log('Connected to Airtable but no records found');
      }
    });
  } else {
    console.log('Missing Airtable credentials:');
    console.log('API Key present:', !!process.env.NEXT_AIRTABLE_API_KEY);
    console.log('Base ID present:', !!process.env.NEXT_AIRTABLE_BASE_ID);
  }
} catch (error) {
  console.error('Error initializing Airtable:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}

export { base };

export async function fetchEmailRequests() {
  return new Promise((resolve, reject) => {
    if (!base) {
      console.log("Airtable not configured");
      resolve([]);
      return;
    }

    const records = [];
    
    base('Email').select({
      view: "Grid view"
    }).eachPage(function page(pageRecords, fetchNextPage) {
      pageRecords.forEach(function(record) {
        records.push({
          id: record.id,
          recipient: record.get('Contact'),
          subject: record.get('Subject'),
          content: record.get('Content'),
          status: record.get('Status') || 'pending',
          created_at: record._rawJson.createdTime // Use Airtable's built-in creation time
        });
      });

      fetchNextPage();
    }, function done(err) {
      if (err) {
        console.error('Error fetching email requests:', err);
        resolve([]);
        return;
      }
      resolve(records);
    });
  });
}

// Function to watch for changes in Airtable
export async function watchEmailChanges(callback) {
  if (!base) {
    console.log("Airtable not configured");
    return () => {};
  }

  let lastFetch = new Date();
  
  // Poll for changes every 5 seconds
  const interval = setInterval(() => {
    base('Email').select({
      filterByFormula: `IS_AFTER(CREATED_TIME(), '${lastFetch.toISOString()}')`,
      view: "Grid view"
    }).firstPage(function(err, records) {
      if (err) {
        console.error('Error watching email changes:', err);
        return;
      }

      if (records.length > 0) {
        lastFetch = new Date();
        const transformedRecords = records.map(record => ({
          id: record.id,
          recipient: record.get('Contact'),
          subject: record.get('Subject'),
          content: record.get('Content'),
          status: record.get('Status') || 'pending',
          created_at: record._rawJson.createdTime
        }));
        callback(transformedRecords);
      }
    });
  }, 5000);

  return () => clearInterval(interval);
}

export async function updateEmailStatus(recordId, status) {
  return new Promise((resolve, reject) => {
    if (!base) {
      console.log("Airtable not configured");
      resolve(null);
      return;
    }

    base('Email').update(recordId, {
      Status: status
    }, function(err, record) {
      if (err) {
        console.error('Error updating email status:', err);
        reject(err);
        return;
      }
      resolve(record);
    });
  });
}

export async function createEmailRecord(data) {
  return new Promise((resolve, reject) => {
    if (!base) {
      console.log("Airtable not configured");
      resolve(null);
      return;
    }

    base('Email').create([
      {
        fields: {
          Contact: data.recipient,
          Subject: data.subject,
          Content: data.content,
          Status: 'pending'
        }
      }
    ], function(err, records) {
      if (err) {
        console.error('Error creating email record:', err);
        reject(err);
        return;
      }
      resolve(records[0]);
    });
  });
}

export async function createAIResponse(emailId, response) {
  return new Promise((resolve, reject) => {
    if (!base) {
      console.log("Airtable not configured");
      resolve(null);
      return;
    }

    base('Email').find(emailId, function(err, originalEmail) {
      if (err) {
        console.error('Error finding original email:', err);
        reject(err);
        return;
      }

      base('Email').create([
        {
          fields: {
            Contact: originalEmail.get('Contact'),
            Subject: `Re: ${originalEmail.get('Subject')}`,
            Content: response,
            Status: 'sent',
            is_ai_response: true,
            original_email_id: emailId
          }
        }
      ], function(err, records) {
        if (err) {
          console.error('Error creating AI response:', err);
          reject(err);
          return;
        }
        resolve(records[0]);
      });
    });
  });
} 