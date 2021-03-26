///dbPassword = 'mongodb+srv://YOUR_USERNAME_HERE:'+ encodeURIComponent('YOUR_PASSWORD_HERE') + '@CLUSTER_NAME_HERE.mongodb.net/test?retryWrites=true';

//dbPassword = "mongodb+srv://ecerasystem:ecerasystem@cluster0.jlme1.mongodb.net/ecerasystem?retryWrites=true&w=majority";
dbPassword = "mongodb://localhost:27017/UserAuth";

module.exports = {
    mongoURI: dbPassword
};
