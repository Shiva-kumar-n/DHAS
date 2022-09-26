const { query, response } = require('express');
const express = require('express');
const nedb = require('nedb');
const path =require('path');
const mailer = require('nodemailer');

const app = express()
app.use(express.static(path.resolve(__dirname,'..')+"/Client"));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.resolve(__dirname,'..')+"/Client");

const detailsDB = new nedb("Details.db");
const attendDB = new nedb("Attendence.db");
const reviewDB = new nedb("Review.db");
const postDB = new nedb("Posts.db");
postDB.loadDatabase();
detailsDB.loadDatabase();
attendDB.loadDatabase();
reviewDB.loadDatabase();


User_details = "";

app.listen(5000,() =>
{
    console.log("Server Listening");
})

app.get('/',(req,res) =>{
    res.sendFile((path.resolve(__dirname,'..'))+"/Client/Login.html");
})

app.post('/login',(req,res) =>{
    
    let loginDetails = req.body;
    let query = {"UserId" : loginDetails.Username.toLowerCase()};
    let LoginCode = 0;
    
    detailsDB.find(query,(err,output) => {
        if(err)
        {
            console.log("Some Error Occured",err);
            return;
        }
        if(output.length == 0)
        {
            
            LoginCode = 404;
        }
        else{
            output = output[0];
            if(output.Password == loginDetails.Password)
            {
                LoginCode = 200;
            }
            else{
                LoginCode = 400;
            }
        }
        if(LoginCode == 200)
        {
            
            console.log("Login Details",output);
            console.log("name:",  output.Username);
            console.log("userDetails:",  output);
            res.render("Home.html", { name: output.Username ,isLogged : true,userDetails:output});
        }
        else if(LoginCode == 404)
        {
            res.render("Login.html", { Message: "UserNotFound" });
        }
        else if(LoginCode = 400)
        {
            res.render("Login.html", { Message: "PasswordInCorrect" });
        }
    })
})

app.post('/register',(req,res) =>{
    req.body.UserId = req.body.UserId.toLowerCase();
    let query = {"UserId":req.body.UserId};
    detailsDB.find(query,(err,output) => {
        if(err)
        {
            console.log("Some Error Occured",err);
            return;
        }
        if(output.length == 0){
            detailsDB.insert(req.body);
            res.render("Register.html",{serverMessage: "Registered"});
        }
        else{
            let ErrorMessage = "User Already Existed";
            res.render("Register.html",{serverMessage:ErrorMessage});
        }
    })
})

app.post('/feedback',(req,res) => {
    reviewDB.insert(req.body);
    console.log("Added feed",req.body);
    res.render("Feedback.html");
})

app.post('/forget',(req,res)=>{
    let loginDetails = req.body;
    let query = {"UserId" : loginDetails.UserId.toLowerCase()};
    let LoginCode = 0;
    detailsDB.find(query,(err,output) => {
        if(err)
        {
            console.log("Some Error Occured",err);
            return;
        }
        if(output.length == 0)
        {
            LoginCode = 404;
        }
        else{
            output = output[0];
            let e1 = (output.secu_q == loginDetails.secu_q);
            let e2 = (output.secu_q_a == loginDetails.secu_q_a);
            if(e1 && e2)
            {
                let query = {"UserId":req.body.UserId.toLowerCase()};
                output.Password = req.body.Password; 
                LoginCode = 200;
                detailsDB.update(query,
                    {$set:output},
                    {},
                    (err,num)=>{
                        console.log("Replace",num);
                    })
            }
            else{
                LoginCode = 400;
            }
        }
        if(LoginCode == 200)
        {
            console.log("Login Details",output);
            res.render("ForgetPassword.html", { Message: "Changed"});
        }
        else if(LoginCode == 404)
        {
            res.render("ForgetPassword.html", { Message: "IDNotExists" });
        }
        else if(LoginCode = 400)
        {
            res.render("ForgetPassword.html", { Message: "ISQ" });
        }
    })

})



app.post('/userAttendance',(req,res)=>{
    let UserId = req.body.UserId;
    let date = req.body.date;
    let query = {"UserId":UserId,"date":date};
    attendDB.find(query,(err,output) =>{
        if(err)
        {
            console.log("Error",err);
            return;
        }
        if(output.length == 0)
        {
            attendDB.insert(req.body);
        }
        else{
            attendDB.remove(query,(err,num)=>{
                if(err)
                {
                    console.log("error",err);
                    return;
                }
            })
            attendDB.insert(req.body);
        }
    })
    res.render("Attendance.html");
})

app.post('/updateProfile',(req,res) =>{
    let query = {"UserId":req.body.UserId};
    detailsDB.update(query,
        {$set:req.body},
        {},
        (err,num)=>{
            console.log("Replace",num);
        })
    detailsDB.find(query,(err,output)=>{
        res.send(JSON.stringify(output));
    })
    
})

app.post('/Adminregister',(req,res)=>{
    let query = {"Username":req.body.Username,"type":"Admin"};
    detailsDB.find(query,(err,output) => {
        if(err)
        {
            console.log("Some Error Occured",err);
            return;
        }
        if(output.length == 0){
            details = req.body;
            details["type"] = "Admin";
            detailsDB.insert(details);
            res.render("AdminRegister.html",{serverMessage: "Registered"});
        }
        else{
            let ErrorMessage = "User Already Existed";
            res.render("AdminRegister.html",{serverMessage:ErrorMessage});
        }
    })
})

app.post('/Adminlogin',(req,res) =>{
    let loginDetails = req.body;
    let query = {"Email" : loginDetails.Email,"type":"Admin"};
    let LoginCode = 0;
    detailsDB.find(query,(err,output) => {
        if(err)
        {
            console.log("Some Error Occured",err);
            return;
        }
        if(output.length == 0)
        {
            LoginCode = 404;
        }
        else{
            output = output[0];
            if(output.Password == loginDetails.Password)
            {
                LoginCode = 200;
            }
            else{
                LoginCode = 400;
            }
        }
        if(LoginCode == 200)
        {
            console.log("Login Details",output);
            res.render("AdminHome.html", { name: output.Username ,isLogged : true,userDetails:output});
        }
        else if(LoginCode == 404)
        {
            res.render("AdminLogin.html", { Message: "UserNotFound" });
        }
        else if(LoginCode = 400)
        {
            res.render("AdminLogin.html", { Message: "PasswordInCorrect" });
        }
    })
})

app.post('/addPost',(req,res)=>{
    req.body.date = Date();
    let data = req.body;
    postDB.insert(data);
    res.render("updatePost.html");

})

app.get('/getPosts',(req,res)=>{
    postDB.find(query(),(err,response)=>{
        if(err)
        {
            console.log(err);
            return;
        }
        
        res.json(response)
    })
})


app.get('/getFeed',(req,res)=>{
    reviewDB.find(query(),(err,response)=>{
        if(err)
        {
            console.log(err);
            return;
        }
        res.json(response)
    })
})

app.get('/getAttend',(req,res)=>{
    attendDB.find(query(),(err,response)=>{
        if(err)
        {
            console.log(err);
            return;
        }
        console.log("res",response);
        res.json(response)
    })
})

app.post('/verifyEmail',(req,res)=>{
    if('otp' in req.body)
    {
        if(req.body.otp == My_otp)
        {
            detailsDB.insert(User_details);
            res.render("Register.html",{serverMessage: "Registered"});
        }
        else{
            console.log("FAILURE VALIDATION");
            res.render("VerifyEmail.html",{Email:User_details.Email,Message:"Wrong OTP"});
        }
    }
    else{
        req.body.UserId = req.body.UserId.toLowerCase();
        let query = {"UserId":req.body.UserId};
        detailsDB.find(query,(err,output) => {
            if(err)
            {
                console.log("Some Error Occured",err);
                return;
            }
            if(output.length != 0){
                let ErrorMessage = "User Already Existed";
                res.render("Register.html",{serverMessage:ErrorMessage});
            }
            else{
                let tempMail = //"Mail ID of Student";
                req.body.Email = tempMail;
                User_details = req.body;
                My_otp = Math.floor(1000 + Math.random() * 9000);
                sendMail(tempMail,My_otp);
                res.render("VerifyEmail.html",{Email:req.body.Email,Message:"Sending"});
            }
        })
    }
})


function sendMail(receiveEmail , OTP)
{
    let mailTransporter = mailer.createTransport({
        service : "gmail",
        auth:{
            user : "user@gmail.com",
            pass : 'Password'
        }
    })

    let MailMessage = "Your OTP is " + OTP;
    let SendDetails = {
        from : "user@gmail.com",
        to : receiveEmail,
        subject : "OTP For DHS Registration",
        text : MailMessage

    }

    mailTransporter.sendMail(SendDetails,(err)=>{
        if(err)
        {
            console.log("Some ERROR",err);
            return;
        }
        else{
            console.log("EMAIL SENT......");
        }
    })
}
