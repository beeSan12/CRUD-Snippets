# Assignment B1 - CRUD Snippets

In this assignment, you will create a web application to manage code [snippets](https://en.wikipedia.org/wiki/Snippet_(programming)). The web application will use the Node.js platform, Express as the application framework, and Mongoose as the object data modeling (ODM) library for MongoDB.

You must use the repository created for you and this assignment and make continuous commits so it is possible to follow the web application's creation. Make sure that no more files than necessary are committed to the repository. (#6)

To announce that you have completed the assignment, you must make a merge request of your assignment at its repository on GitLab.

## The web application

The web application must be a Node.js application that uses Express as the application framework and Mongoose as the ODM to create a web application that can store data persistently. You must follow the course's coding standard. You must split your source code into several modules. Of course, you need to document and comment on the source code. (#5, #1, #4)

After cloning the repository with the application's source code and running the `npm install` command, it must be easy to lint the source code and run the application. Therefore, add the script start and lint to the "scripts" field in the package.json file. (#3)

A MongoDB database must store the web application's data. You are free to use [MongoDB as a Docker container](https://hub.docker.com/_/mongo) or a cloud-hosted MongoDB, for instance, [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). (#7)

Users must be able to register and log into the application after entering a username and a password. The username must be unique to the application, and the password must not be recoverable. A logged-in user must be able to log out of the application. (#13, #14, #15)

For the application to differentiate between an anonymous and authenticated user, there must be support for some basic authentication and authorization. You may only use session storage on the server side, using the [express-session](https://www.npmjs.com/package/express-session) package to implement authentication and authorization. __You must not use any packages, such as Passport, etc., to authenticate or authorize.__ (#16)

The web application must have full CRUD functionality regarding snippets, whereby users must create, read, update, and delete snippets. Anonymous users should only be able to view snippets. In addition to viewing snippets, authenticated users must create, edit, and delete them. __No one but the owner or creator of a snippet must be able to edit and delete the said snippet.__ When creating and viewing snippets, __the application must support multiline text__, enabling the logged-on user to write real code snippets, not just one-line texts. (#8, #9, #10, #11, #12)

The application should be easy to use and understand, so it should notify the user of what is happening, such as flash messages. Do not invite users to make mistakes. Do not include UI options in the web applications that the user does not have permission to do. (#18)

The application must send an HTTP status code 404 (Not Found) when a user requests a non-existent resource or a resource that requires authentication. When an authenticated user does not have permission to access a requested resource, the application must send an HTTP status code 403 (Forbidden). Only send the HTTP status code 500 (Internal Server Error) when necessary. (#10, #11, #12)

As far as possible, protect the application from vulnerable attacks. (#19)

You must deploy the application on your given server in CSCloud. (#17)

### Extra features [optional]

Feel free to add functionality to the application and get an extra plus on the assignment. Some examples of this could be:

- Add support for tagging each snippet with one or more tags.
- Add support for showing snippets belonging to one tag or/and one user.
