const mongoose= require("mongoose")
const Scategorie=require("./scategorie.js");
const articleSchema=mongoose.Schema({
    designation:{type:String,required:true,unique:true},
    reference: {type:String,required:true,unique:true},
    marque: {type:String,required:true},
    qtestock:{type:Number,required:false},
    prix:{type:Number, required:false},
    imageart:{type:String,required:false},
    scategorieID:{type:mongoose.Schema.Types.ObjectId,ref:Scategorie}
})
module.exports=mongoose.model("article",articleSchema)//pour faire reference au scategorie