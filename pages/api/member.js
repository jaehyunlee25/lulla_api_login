// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
var {Client}=require("pg");
var client=new Client({
	user:"postgres",
	host:"13.124.176.157",
	database:"test",
	password:"123456",
	port:"5432"
});
export default aync function handler(req, res) {
	var q1="select * from member;";
	var data=await getData();
	res.status(200).json({ name: 'member' });
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

