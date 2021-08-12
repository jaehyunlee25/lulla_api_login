var {Client}=require("pg");
export default function procQuery(sql){
	var client=new Client({
		user:process.env.db_user,
		host:process.env.db_host,
		database:process.env.db_name,
		password:process.env.db_password,
		port:process.env.db_port
	});
	client.connect();
	var promise=new Promise((resolve,reject)=>{
		client.query(sql,(err,res)=>{
			if(err) reject({type:"error",message:err});
			else resolve({type:"success",message:res});
			client.end();
		});
	});
	return 
	
};