const mongoose =require("mongoose")
const categorieSchema=mongoose.Schema({//no structured haka 3lch n3mloulha schema
    nomcategorie: {type:String,required:true,unique:true},//bch categorie mfmch kan hiya be logique
    imagecategorie: {type:String,required:false}
})
module.exports=mongoose.model("Categorie",categorieSchema)
