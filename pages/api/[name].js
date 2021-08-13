// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {RESPOND,ERROR} from "/lib/apiCommon";
import setBaseURL from "/lib/pgConn";	//include String.prototype.fQuery
export default async function handler(req,res){
	setBaseURL("sqls");	//끝에 슬래시 붙이지 마시오!
	var qName=await "name".fQuery({table_name:req.query.name});
	res.status(200).json(qName);
};