/// <reference types="cypress" />

describe('Test with backend', () =>
{
    beforeEach('login to the app', () =>
    {
        //1 way - standard way
        // cy.intercept('GET', '**/tags', {fixture: 'tags.json'})
        //2 way - with object and listening for path
        cy.intercept({method: "Get", path: 'tags'}, {fixture: 'tags.json'})
        cy.loginToApplication()
    })

    it('verify correct request and response', () => 
    {
        //to intercept the API calls - define before the action performing
        cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticles')

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('The title for testing')
        cy.get('[formcontrolname="description"]').type('The description for testing')
        cy.get('[formcontrolname="body"]').type('The body for testing body')
        cy.contains('Publish Article').click()

        // cy.wait('@postArticles')
        cy.wait('@postArticles').then( xhr =>
        {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('The body for testing body')
            expect(xhr.response.body.article.description).to.equal('The description for testing')
        })

    })

    it('intercepting and modifying the request and response', () => 
    {
        //modifying the request body
        //to intercept the API calls - define before the action performing
        // cy.intercept('POST', '**/articles', (req) =>
        // {
        //     req.body.article.description = "The description for testing 2"
        // }).as('postArticles')

        //modifying the response body descirption
        cy.intercept('POST', '**/articles', (req) =>
        {
            req.reply ( res =>
            {
                expect(res.body.article.description).to.equal('The description for testing')
                res.body.article.description = "The description for testing 2"
            })
        }).as('postArticles')


        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('The title for testing 3')
        cy.get('[formcontrolname="description"]').type('The description for testing')
        cy.get('[formcontrolname="body"]').type('The body for testing body')
        cy.contains('Publish Article').click()

        // cy.wait('@postArticles')
        cy.wait('@postArticles').then( xhr =>
        {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('The body for testing body')
            expect(xhr.response.body.article.description).to.equal('The description for testing 2')
        })

        //deleting the article after 2sec
        cy.wait(2000)
        cy.contains('Delete Article').click()

    })

    it('verify popular tags are displayed', () =>
    {
        //checking tags if we intercepted these tags on start
        cy.get('.tag-list')
            .should('contain', 'cypress')
            .and('contain', 'automation')
            .and('contain', 'testing')
        
    })

    it('verify global feed likes count', () =>
    {
        cy.intercept('GET', 'https://api.realworld.io/api/articles/feed*', {"articles":[],"articlesCount":0})
        cy.intercept('GET', 'https://api.realworld.io/api/articles?limit=10&offset=0', {fixture: 'articles.json'})

        //check if the favorite count is equal to provided in json
        cy.contains('Global Feed').click()
        cy.get('app-article-list button').then( heartList =>
        {
            expect(heartList[0]).to.contain(1)
            expect(heartList[1]).to.contain(5)
        })

        //veryfing POST favorite button 
        cy.fixture('articles').then( file =>
        {
            const articleLink = file.articles[1].slug
            file.articles[1].favoritesCount = 6
            cy.intercept('POST', 'https://api.realworld.io/api/articles/'+articleLink+'/favorite', file)
        })

        cy.get('app-article-list button').eq(1).click().should('contain', 6)
    })

    it('delete a new article in a global feed', () =>
    {
        //user credentials to sign in
        const userCred = {
            "user": {
                "email": "artem.bondar16@gmail.com",
                "password": "CypressTest1"
            }
        }

        const bodyRequest = {
            "article": {
                "title": "API request test",
                "description": "api cypress testing",
                "body": "e2e cypress api",
                "tagList": []
            }
        }

        //requests API login and creating an article
        cy.request('POST', 'https://api.realworld.io/api/users/login', userCred).its('body').then(body =>
        {
            const token = body.user.token

            cy.request({
                url: "https://api.realworld.io/api/articles/",
                headers: { "Authorization": "Token " + token },
                method: "POST",
                body: bodyRequest
            }).then( res =>
            {
                expect(res.status).to.equal(200)
            })

            cy.contains("Global Feed").click()
            cy.wait(1000)
            //get the first article from the list
            cy.get('.article-preview').first().click()
            cy.wait(1000)
            //get the article button delete
            cy.get('.article-actions').contains('Delete Article').click()

            //verify if the article has been deleted
            cy.request({
                url: 'https://api.realworld.io/api/articles?limit=10&offset=0',
                headers: { "Authorization": "Token " + token },
                method: "GET"
            }).its('body').then( body => 
            {
                console.log(body)
                expect(body.articles[0].title).not.to.equal('API request test')
            })

        })

        
    })

    it.only('delete a new article in a global feed with APU login authorization', () =>
    {
        const bodyRequest = {
            "article": {
                "title": "API request test",
                "description": "api cypress testing",
                "body": "e2e cypress api",
                "tagList": []
            }
        }

        //requests API login and creating an article
        cy.get('@token').then(token =>
        {
            cy.request({
                url: "https://api.realworld.io/api/articles/",
                headers: { "Authorization": "Token " + token },
                method: "POST",
                body: bodyRequest
            }).then( res =>
            {
                expect(res.status).to.equal(200)
            })

            cy.contains("Global Feed").click()
            cy.wait(1000)
            //get the first article from the list
            cy.get('.article-preview').first().click()
            cy.wait(1000)
            //get the article button delete
            cy.get('.article-actions').contains('Delete Article').click()

            //verify if the article has been deleted
            cy.request({
                url: 'https://api.realworld.io/api/articles?limit=10&offset=0',
                headers: { "Authorization": "Token " + token },
                method: "GET"
            }).its('body').then( body => 
            {
                console.log(body)
                expect(body.articles[0].title).not.to.equal('API request test')
            })

        })

        
    })

})