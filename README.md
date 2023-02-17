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
- Retrieving details about users
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

## Main URL (use with POSTMAN or similar tools)

```
https://e-commerce-api-jxc4.onrender.com/api/v1
```

**Notice 1-**
Web Services on the free instance type on Render.com are automatically spun down after 15 minutes of inactivity. When a new request for a free service comes in, Render spins it up again so it can process the request.
This can cause a response delay of up to 30 seconds for the first request that comes in after a period of inactivity.

**Notice 2-**
Right now there is NO front-end page. When visiting the link you will get 'Route does not exist'.
But it will work fine with Postman.

### URL for published documentation

https://documenter.getpostman.com/view/24129958/2s93CEvFpZ

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

- `POST /users/:{username}/follow`: Follow a user
- `POST /users/:{username}/unfollow`: Unfollow a user

### Review

- `POST /reviews`: Write a review for a product (only for purchased products)
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

### Product

- `POST /products`: Create a new product (available only to admin)
- `GET /products`: Retrieve a list of all products (10 products per page, navigate by adding ?page={number} to the url)
- `GET /products/:{id}`: Retrieve details of a specific product
- `PATCH /products/:{id}`: Update details of a specific product (available only to admin)
- `DELETE /products/:{id}`: Delete a specific product (available only to admin)
- `POST /products/uploadImage`: Upload an image to get a source link (available only to admin)
- `GET /products/:{id}/reviews`: Retrieve all reviews for a specific product
- `GET /products/ownedProducts`: Retrieve all owned products of the currently logged-in user

#### Advanced Query Options (getAllProducts)

##### Search

To search for products based on a keyword in their name or description, use the following endpoint:

- `GET /products?search={keyword}`: Retrieves a list of products that match the keyword in their name or description.

##### Sorting

To sort the list of products based on a specific field in ascending or descending order, use the following endpoints:

- `GET /products?sort={field}`: Retrieves a list of products sorted by a specific field (e.g. price, averageRating, company) in ascending order.
- `GET /products?sort={field}&sortOrder={asc|desc}`: Retrieves a list of products sorted by a specific field (e.g. price, averageRating, company) in ascending or descending order.

##### Numeric Filters

To filter the list of products based on a numeric condition for the above fields(price, averageRating, numOfReviews), use the following endpoint:

- `GET /products?numericFilters={field}{operator}{value}`: Retrieves a list of products that match a numeric condition (e.g. price > 50000 or averageRating <= 35000).

##### Field Selection

To retrieve only the specified fields of the product objects in the response, use the following endpoint:

- `GET /products?fields={field1},{field2},{field3},...`: Retrieves only the specified fields of the product objects in the response.

##### Other Filters

To filter the list of products based on certain conditions, use the following endpoints:

- `GET /products?featured={true|false}`: Retrieves a list of featured or non-featured products.
- `GET /products?freeShipping={true|false}`: Retrieves a list of products that have free shipping or not.

###### Examples

Here are some examples of how to use the advanced query options in the URL:

```
https://e-commerce-api-jxc4.onrender.com/api/v1/products?search=chair
```

```
https://e-commerce-api-jxc4.onrender.com/api/v1/products?sort=price&sortOrder=desc&numericFilters=price>50000&fields=name,price,company
```

```
https://e-commerce-api-jxc4.onrender.com/api/v1/products?featured=true
```

```
https://e-commerce-api-jxc4.onrender.com/api/v1/products?featured=true&freeShipping=true
```

### Conclusion

I hope that this API will provide you with the necessary tools to build an amazing e-commerce platform. If you have any questions or concerns, please feel free to reach out.
