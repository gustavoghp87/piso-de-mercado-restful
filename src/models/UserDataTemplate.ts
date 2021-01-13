export type typeGroup = {
    name: string
    channels: string[]
}

export class UserDataTemplate {
    username: string
    password: string
    email: string
    superAdmin: boolean
    groupAdmin: boolean
    profileImage: string
    groups: typeGroup[]
    token:string

    constructor() {
        this.username = ""
        this.password = "password"
        this.email = ""
        this.superAdmin = false
        this.groupAdmin = false
        this.profileImage = "profile.png"
        this.token = ""
        this.groups = [
            {
                name: "newbies",
                channels: [
                    "general", 
                    "help"
                ]
            },
            {
                name: "general",
                channels: [
                    "general", 
                    "chitchat", 
                    "topic of the day"
                ]
            }
        ]
    }
}
