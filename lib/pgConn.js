var {Client}=require("pg");
var client=new Client({
	user:process.env.db_user,
	host:process.env.db_host,
	database:process.env.db_name,
	password:process.env.db_password,
	port:process.env.db_port
});
export default function getData(sql){
	client.connect();
	return new Promise((resolve,rej)=>{
		client.query(
			sql,
			(err,res)=>{
				if(err){
					console.dir(err);
					return;
				}		
				resolve(res);
				client.end();
			}
		);		
	});
	
};