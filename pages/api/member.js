// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
var {Client}=require("pg");
var client=new Client({
	user:process.env.db_user,
	host:process.env.db_host,
	database:process.env.db_name,
	password:process.env.db_password,
	port:process.env.db_port
});
export default async function handler(req, res) {
	var q1="select * from member;";
	var data=await getData();
	res.status(200).json(data);
};
function getData(){
	client.connect();
	var q1="select * from member;";
	return new Promise((resolve,rej)=>{
		client.query(
			q1,
			(err,res)=>{
				if(err){
					dir(err);
					return;
				}		
				resolve(res);
				client.end();
			}
		);		
	});
	
};

