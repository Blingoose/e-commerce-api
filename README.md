# E-Commerce API

## Introduction

Welcome to the E-Commerce API, a RESTful API that allows you to manage various aspects of an e-commerce platform. With this API, you can perform actions such as:

- Registering a user
- Logging in and out
- Retrieving details about users
- Creating and managing products
- Reviewing products
- Managing orders

## Authentication

The following endpoints require authentication (user must be registered and logged-in):

- Updating details of a specific user
- Reviewing a product
- Creating an order
- Updating an order
- Retrieving current user's order

The only endpoints that require the user to be an admin are:

- Retrieving a list of all orders
- Creating a product
- Uploading an image of a product
- Updating a product
- Deleting a product

All other endpoints do not require authentication.

## Error Handling

In case of any errors, the API will return a JSON object with an error message. The HTTP status code will also indicate the type of error that occurred.

## Endpoints

### Auth:

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login as a registered user
- `POST /auth/logout`: Log out of the current session

### User:

- `GET /users`: Retrieve a list of all users
- `GET /users/showMe`: Retrieve details of the current logged user
- `GET /users/:{username}`: Retrieve details of a specific user
- `PATCH /users/updateUser`: Update details of the currently logged user
- `PATCH /users/updateUserPassword`: Update password for the current user
- `DELETE /users/:{username}`: Retrieve a list of all users

**_ Experimental User Endpoints _**

- `POST /users/:{username}/unfollow`: Follow a user
- `POST /users/:{username}`: Unfollow a user

### Product

- `POST /products`: Create a new product (available only to admin)
- `GET /products`: Retrieve a list of all products
- `GET /products/:{id}`: Retrieve details of a specific product
- `PATCH /products/:{id}`: Update details of a specific product (available only to admin)
- `DELETE /products/:{id}`: Delete a specific product (available only to admin)
- `POST /products/uploadImage`: Upload an image to get a source link that can be added to a product (available only to admin)
- `GET /products/:{id}/reviews`: Retrieve all reviews for a specific product

### Review

- `POST /reviews`: Write a review for a product
- `GET /reviews`: Retrieve all reviews
- `GET /reviews/:{id}`: Retrieve details of a specific review
- `PATCH /reviews/:{id}`: Update the details of a review
- `DELETE /reviews/:{id}`: Delete a specific review

### Order

- `POST /orders`: Create a new order
- `GET /orders`: Retrieve a list of all orders (available only to admin)
- `GET /orders/showAllMyOrders`: Retrieve all orders of the currently logged user
- `GET /orders/:{id}`: Retrieve details of a specific order
- `PATCH /orders/:{id}`: Update the status of an order

## User credentials to play around

### Admin User Login

- email: `test-admin@gmail.com`
- password: `123456789`

### Non-admin User Login

- email: `ron@gmail.com`
- password: `123456789`

## Conclusion

I hope that this API will provide you with the necessary tools to build an amazing e-commerce platform. If you have any questions or concerns, please feel free to reach out.
