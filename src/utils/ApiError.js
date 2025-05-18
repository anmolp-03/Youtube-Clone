// general format of error ... taaki error sab jagah same format me jaaye
// 'Error' online ek package hai Node.js ka

class ApiError extends Error {

    constructor (
        statusCode , 
        message = "something went wrong" , 
        errors = [] , 
        stack = ""
    ){
        // saare errors ko apne error se override krenge
        super(message)
        this.statusCode = statusCode
        this.data = null 
        this.message = message
        this.success = false
        this.errors = errors 
    }

}

export {ApiError}