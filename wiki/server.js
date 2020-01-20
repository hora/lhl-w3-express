
// --- GENERAL SETUP ---
// ---------------------

// require express
const express = require('express');

// require body parser, for parsing data in HTTP request body
const bodyParser = require('body-parser');

// set the HTTP port
// a convention is to set this value in an environment variable, if it's present
// (process.env.PORT)
// otherwise, set it to 3000
const PORT = process.env.PORT || 3000;

// initialize express app
const app = express();

// specify the static asset folder (css, images, etc)
app.use(express.static('public'));

// initialize the body-parser package
app.use(bodyParser());

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




// --- ARTICLE ROUTES ---
// ----------------------

// the / route is the home, or index, page
// this route will render a list of the titles of all wiki articles
app.get('/', function(request, response) {
    // we're going to need the articles on the index page
    // so we add them to the template variables
    const templateVars = {
        articles: articles
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



// --- USER AUTHENTICATION ROUTES ---
// ----------------------------------

app.get('/login', function(request, response) {
});

app.post('/login', function(request, response) {
});

app.get('/register', function(request, resposne) {
});

app.post('/users', function(request, response) {
});



// --- RUNNING THE SERVER ---
// --------------------------

// start the server, and listen to incoming HTTP requests on the port specified
// by PORT
app.listen(PORT, function() {
    console.log(`Server listening on port ${PORT}`);
});

