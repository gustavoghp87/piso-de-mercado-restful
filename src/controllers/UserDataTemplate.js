/**
 * The user data default template
 */

 class UserDataTemplate {
    constructor() {
        this.username = "";
        this.password = "password";
        this.email = "";
        this.superAdmin = false;
        this.groupAdmin = false;
        this.profileImage = "profile.gif";
        this.groups = [
            {
                "name": "newbies",
                "channels": [
                    "general", 
                    "help"
                ]
            },
            {
                "name": "general",
                "channels": [
                    "general", 
                    "chitchat", 
                    "topic of the day"
                ]
            }
        ]
    }
}


module.exports = UserDataTemplate
