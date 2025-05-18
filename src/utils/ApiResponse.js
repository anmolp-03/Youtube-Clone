// Req res hum node.js se nhi express.js se krte h
// therefore, uske liye koyi package nhi hai like in error

class ApiResponse{
    constructor(statusCode, data, message = "Success"){     //success kyuki response hai
        this.data=data
        this.statusCode = statusCode
        this.message = message
        this.success = statusCode < 400     // 404 - not found 
    }
}