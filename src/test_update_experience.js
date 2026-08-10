require('dotenv').config({path: '../.env'});
require('./config/database').query("UPDATE cats SET req_experience_level = 'beginner' WHERE cat_id = 1").then(() => { console.log('Updated'); process.exit(0); });
