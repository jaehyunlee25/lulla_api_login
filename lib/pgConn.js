import fs from "fs";	//fs의 baseUrl은 프로젝트 메인이다. 
var {Client}=require("pg");
var baseUrl="/sqls";
String.prototype.fQuery=async function(param){
	var path=baseUrl+"/"+this+".sql",
		sql=fs.readFileSync(path,"utf8");
	Object.keys(param).forEach(key=>{
		var regex=new RegExp("\\$\\{"+key+"\\}","g"),	//백슬래시 두 번, 잊지 말 것!!
			val=param[key];
		sql=sql.replace(regex,val);
	});
	
	console.log(sql,"\n\n\n\n\n");
	
	var result;
	try{
		result=await procQuery(sql);
	}catch(err){
		console.log(err,"\n\n\n\n");
		result={
			type:"error",
			onError:(res,id,name)=>{
				var param={
					type:"error",
					resultCode:400,
					id:["ERR",baseUrl,id].join("."),
					name:[name,"query failed"].join(" ")				
				};
				res.end(JSON.stringify(param));
			}
		};
	}
	
	return result;
};
function procQuery(sql){
	var client=new Client({
		user:process.env.db_user,
		host:process.env.db_host,
		database:process.env.db_name,
		password:process.env.db_password,
		port:process.env.db_port
	});
	console.log({
		user:process.env.db_user,
		host:process.env.db_host,
		database:process.env.db_name,
		password:process.env.db_password,
		port:process.env.db_port
	});
	client.connect();
	var promise=new Promise((resolve,reject)=>{
		client.query(sql,(err,res)=>{
			if(err){
				reject(err);
			}else{
				console.log(res,"\n\n\n\n");
				resolve({type:"success",message:res});
			}
			client.end();
		});
	});
	return promise;	
};
export default function setBaseURL(url){
	baseUrl=url;
};