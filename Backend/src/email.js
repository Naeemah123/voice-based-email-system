const {SUCCESS, NOT_AUTH, UNEXPECTED} = require("./error_codes.js");
const { pool } = require("./db.js");

exports.fetch_emails = function(req, response) {
    if (req.session.email) {
        const search = req.body["search"];
        
        if (search === "SENT") {
            pool.query("SELECT recipient AS target, subject, content FROM sent_emails WHERE sender = $1",
                [req.session.email], (err, res) => {
                    if (err) {
                        console.error("Database Fetch Error:", err);
                        response.send({
                            code: UNEXPECTED,
                            detail: err.detail,
                            data: null
                        });
                    } else {
                        response.send({
                            code: SUCCESS,
                            detail: "Success",
                            data: res.rows
                        });
                    }
                }
            );
        } else if (search === "INBOX") {

            pool.query("SELECT sender AS target, subject, content FROM received_emails WHERE recipient = $1",
                [req.session.email], (err, res) => {
                    if (err) {
                        console.error("Database Fetch Error:", err);
                        response.send({
                            code: UNEXPECTED,
                            detail: err.detail,
                            data: null
                        });
                    } else {
                        console.log("Fetched Inbox Emails:", res.rows); 
                        response.send({
                            code: SUCCESS,
                            detail: "Success",
                            data: res.rows
                        });
                    }
                }
            );
        } else {
            console.log("Invalid search type"); 
            response.send({
                code: UNEXPECTED,
                detail: "Invalid search type",
                data: null
            });
        }
    } else {
        console.log(" User not authenticated when fetching emails."); 
        response.send({
            code: NOT_AUTH,
            detail: "User not authenticated",
            data: null
        });
    }
};


exports.send_email = function(req, response) {
    if (req.session.email) {
        const body = req.body;
        const subject = body["subject"];
        const to = body["to"];
        const content = body["content"];

        pool.query("INSERT INTO sent_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
            [req.session.email, to, subject, content], (err, res) => {
                if (err) {
                    console.error("Database Insert Error (sent_emails):", err);
                    return response.send({
                        code: UNEXPECTED,
                        detail: err.detail,
                        data: null
                    });
                } 
                
                pool.query("INSERT INTO received_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
                    [req.session.email, to, subject, content], (err) => {
                        if (err) {
                            console.error("Database Insert Error (received_emails):", err);
                            return response.send({
                                code: UNEXPECTED,
                                detail: err.detail,
                                data: null
                            });
                        } 
                        response.send({
                            code: SUCCESS,
                            detail: "Email stored successfully",
                            data: null
                        });
                    }
                );
            }
        );
    } else {
        response.send({
            code: NOT_AUTH,
            detail: "User not authenticated",
            data: null
        });
    }
};
