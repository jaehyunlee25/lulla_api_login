import getData from "/lib/pgConn";
export default async function handler(req,res){
	if(req.method!="POST"){
		res.status(200).json({result:"fail",reason:"not proper method"});
		return;
	}
	const q1="select * from member;";
	let data=await getData(q1);
	res.status(200).json(data);
};