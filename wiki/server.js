
// --- GENERAL SETUP ---
// ---------------------

// require the packages we need
const express = require('express');
const https = require('https'); // for securing our data
const fs = require('fs');
const bodyParser = require('body-parser'); // for parsing HTTP requests
// the following allows us to encrypt our cookies
const cookieSession = require('cookie-session');

// set the HTTP(S) port
// a convention is to set this value in an environment variable, if it's present
// (process.env.PORT)
// otherwise, set it to 3000
const PORT = process.env.PORT || 3000;

// initialize express app
const app = express();

// specify the static asset folder (css, images, etc)
app.use(express.static('public'));

// initialize the body-parser
app.use(bodyParser());

// initialize the cookie session with some random keys
// and setting it to expire in 24 hours
app.use(cookieSession({
    name: 'session',
    keys: ['donna haraway', 'medusa', 'plastic shoes', 'unbreakable!'],
    maxAge: 1000 * 60 * 60 * 24 // 24 hours in miliseconds
}));

// use EJS (Embedded JavaScript) as the engine that renders our views (the HTML)
app.set('view engine', 'ejs');





// --- DATA ---
// ------------

let articles = {
    wiki: {
        id: 'wiki',
        title: 'The meaning of the word \'wiki\'',
        content: '\'Wiki\' means \'quick\' in Olelo Hawai\'i.'
    },
    instructions: {
        id: 'instructions',
        title: 'How to use a wiki',
        content: 'To use this wiki, add a new article from the home page, or click into any article to read, edit or delete it.'
    }
};

let users = {
    1: {
        id: '1',
        username: 'hora',
        password: '123'
    },
    2: {
        id: '2',
        username: 'francis',
        password: 'chicken little'
    }
};

// we can use this to keep track of the ID of the next user
let nextUserID = 3;




// --- ARTICLE ROUTES ---
// ----------------------

// the / route is the home, or index, page
// this route will render a list of the titles of all wiki articles
app.get('/', function(request, response) {

    // look up whether someone has logged in by checking the cookies
    const user = users[request.session.userID];

    // we're going to need the articles on the index page
    // so we add them to the template variables
    // we'll also need the user
    const templateVars = {
        articles: articles,
        user: user
    };

    // render index.ejs, passing along the template variables object
    response.render('index', templateVars);
});

// this route is for rendering a form for creating new articles
// notice that it follows the same pattern as the route for specific
// articles below (/articles/:id could match /articles/new)
// it's important that we register this route first, otherwise
// the one with the wildcard will always match the URL first
app.get('/articles/new', function(request, response) {
    response.render('new');
});

// this route is for showing the content of an individual article,
// this route includes a wildcard, ':id', which represents the ID of the article
// this will match any route that starts with 'articles/'
// and is then followed by any string
// ex: articles/wiki
// ex: articles/instructions
// ex: articles/a-really-long-string-that-doesnt-end-in-another-forward-slash
app.get('/articles/:id', function(request, response) {
    // fetch the article ID from the request URL
    const articleID = request.params.id;

    // we're going to need the specific article on the show page
    // so we add it to the template variables
    const templateVars = {
        article: articles[articleID]
    };

    // render show.ejs, passing along the template variables object
    response.render('show', templateVars);
});

// this route is for editing the article specified by the wildcard, :id
app.get('/articles/:id/edit', function(request, response) {
    // fetch the article ID from the request URL
    const articleID = request.params.id;

    // we're going to need the specific article on the edit page
    // so we can use the current data to populate the edit form
    // here, we add it to the template variables
    const templateVars = {
        article: articles[articleID]
    };

    // render edit.ejs, passing along the template variables object
    response.render('edit', templateVars);
});

// this route takes the form data submitted when a new article is created
// we use this data to save the article (in our in-memory object),
// and then redirect to the newly created article
app.post('/articles', function(request, response) {
    // not the best way to create an ID, but for now, we just grab
    // the first part of the string before a space character
    const newArticleID = request.body.title.split(' ')[0];

    // creating a new article
    const newArticle = {
        id: newArticleID,
        title: request.body.title,
        content: request.body.content
    };

    // saving that article to the in-memory articles object
    articles[newArticleID] = newArticle;

    // redirect the user to the page showing the newly created article
    response.redirect(`/articles/${newArticleID}`);
});

// register a POST request route for updating an article
app.post('/articles/:id', function(request, response) {
    // update the article directly in the in-memory object
    articles[request.params.id] = {
        id: request.params.id,
        title: request.body.title,
        content: request.body.content
    };

    // redirect the user to the page showing the updated article
    response.redirect(`/articles/${request.params.id}`);
});

// register a POST request route for deleting an article
app.post('/articles/:id/delete', function(request, response) {
    // look up the article and delete it
    delete articles[request.params.id];

    // redirect to the home page
    response.redirect('/');
});






// --- USER AUTH ROUTES ---
// ------------------------

app.get('/login', function(request, response) {
    const templateVars = {
        error: false,
        user: users[request.session.userID]
    };

    response.render('login', templateVars);
});

app.post('/login', function(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    // search for whether the username and password match a known user
    let user = null;

    for (let userID in users) {
        // if the username and password were correct, we've found a user
        if (users[userID].username === username && users[userID].password === password) {
            user = users[userID];
        }
    }

    // if we found a user above, set a cookie to remember
    // the logged-in user, then redirect to the home page
    if (user) {
        // response.cookie('userID', user.id);
        request.session.userID = user.id;
        response.redirect('/');
    } else {
        const templateVars = {
            error: true,
            user: users[request.session.userID]
        };

        response.render('login', templateVars);
    }

});

// register a GET request for logging out
// because this action deletes a cookie, some would argue a POST request would
// be more appropriate; however, that would require a logout form, which I find
// annoying
app.get('/logout', function(request, response) {
    // response.clearCookie('userID');

    delete request.session.userID;
    response.redirect('/');
});

app.get('/register', function(request, response) {
    let templateVars = {
        error: false
    };

    response.render('register', templateVars);
});

app.post('/register', function(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    let foundUser;

    // search for whether the username already exists in our in-memory database
    for (const userID in users) {
        if(users[userID].username === username) {
            foundUser = users[userID];
        }
    }

    // this means someone is already registered with that username
    if (foundUser) {
        let templateVars = {
            error: 'That username is already taken, pick another one!'
        }

        response.render('register', templateVars);
    } else {
        let newUser = {
            id: nextUserID,
            username: username,
            password: password
        };

        users[nextUserID] = newUser;
        // increment the next user ID counter so there's no overlapping user IDs
        nextUserID++;

        // once a user has registered (that is, their username and password
        // has been saved to the in-memory database), log the user in
        // and redirect them to the home page
        request.session.userID = newUser.id;
        response.redirect('/');
    }
});







// --- RUNNING THE SERVER ---
// --------------------------

// grab HTTPS certificates
// (note: the certificates we're using for development were not issues
// by a certificate authority, and therefore browsers will notify users
// that the connection is not secure)
// see this SO answer for how to create certificates:
// https://stackoverflow.com/a/52007971
const key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
const cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');
const httpsOptions = {
    key: key,
    cert: cert
};

// create an HTTPS server using the certificates
const server = https.createServer(httpsOptions, app);

// start the server, and listen to incoming HTTPS requests on the port specified
// by PORT
server.listen(PORT, function() {
    console.log(`Server listening on port ${PORT}`);
});

