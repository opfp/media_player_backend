import * as Playable from "./playable" 
import * as Filter from "./filter"
import * as Display from "./display" 

import { Howl, Howler } from "howler";


// const Playable = require("playable") 
// const Filter = require("filter") 
// const Display = require("display") 

import { app, nativeImage, NativeImage } from "electron"

const fs = require('fs') 
const path = require('path') 
const id3 = require('node-id3') 
const get_mp3_dur = require('get-mp3-duration') 

export interface settings{ 
    root_dir : string, 
    recurse ?: boolean,  // true 
    follow_symlinks ?: boolean, // false 
    refresh ?: Function // returnes a tuple, [ items added, items removed ] 
} 

export class Library { 
    // private static instance: Library  
    static toy_data_added : boolean = false 
    private static count : number = 0 
    private static group_count : number = 0 
    // private static awaiting_load : number = 0 
    // static loaded_s : number = 0 
    static loaded_f : number = 0 
    static items : Playable.playable[] = [] 
    static load_complete_callback : Function 
    private static  settings : settings 
    // private static loaded : boolean = false 
    
    static app = require('electron') 
    static root_dir : string = app == undefined ? "/Users/owen/cs/dev/vibez/src/main" : app.getAppPath() 

    static nativeImage = require('electron').nativeImage
    static default_cover : NativeImage = nativeImage.createFromPath(this.root_dir+"/asstes/_default.png") 
    static libray_header : Display.DisplayHeader = {name:"Library", image:this.default_cover, length:"" }
    // static type_playable : Record<string, Playable.playable[]> 

    static buffer_size : number = 6 

    static indexed_atts : { [id:string] : { [id:string] : Playable.playable[] } } = { 
        "type" : {} as {string : Playable.playable[]},  
        "artist" : {} as {string : Playable.playable[]},  
        "album" : {} as {string : Playable.playable[]},  
        "genre" : {} as {string : Playable.playable[]},  
        "name" :  {} as {string : Playable.playable[]}, 
        "plst" : {} as {string : Playable.playable[]}, 
    }

    static uid_plst_info : { [id:number] : Playable.modify_plst } = {} 
    static uid_pg_img : { [id:number] : NativeImage } = {}  
    static path_uid : { [id:string] : number } = {} 

    static uid_playable : {[id:number] : Playable.playable | undefined} = {} 
    // static query_playgroup : { [id:string] : Playable.playgroup } = {} 
    // static query_rets : { [id:string] : Playable.playable[] } 
    //static query_subrets :  { [id:string] : { [id:string] : Playable.playable[] } }
    // static query_subrets : { [id:string]: Playable.playable[] } 

    static readonly indexed_atts_keys : string[] = Object.keys(Library.indexed_atts).sort() 
    static readonly disallowed_name_chars : string = "&|*:;"

    // linear traversal (?) :\ we'll make this faster with a hashtable itf 
    static init_lib( root : string, recursive : boolean ): number { // , callback ?: Function ) { 
        if ( ! fs.statSync(root).isDirectory() ) { 
            throw new Error(root + "Is not a valid root library directory") 
        } 
        // Library.load_complete_callback = callback
        let exp_stack : string[] = [root] 
        // let recurse : boolean = (recursive == undefined || recursive ) ? true : false 
        let recurse = recursive 

        let found_mp3 : string[] = [] 
        let found_video : string[] = []
         
        while ( exp_stack.length > 0 ) { 
            //@ts-ignore 
            let cdir : string = exp_stack.shift() 
            let files : string[] = fs.readdirSync(cdir) //.filter((f:string) => !(f.charAt(0) == '.') )
            
            // console.log(typeof(cdir))
            files.forEach((f_raw : string) => { 
                let f : string = path.join(cdir,f_raw) 
                if ( f == undefined ) { 
                    return; 
                } 
                if ( recurse && fs.statSync(f).isDirectory() ) { 
                    exp_stack.push(f) 
                } 
                let ext = f.split('.').pop()
                if ( ext == undefined ) { return; } 
                if ( ext == 'mp3' ) { 
                    found_mp3.push(f)
                } else if ( ext == 'mp4' ) { 
                    found_video.push(f)
                } 
            })
        } 
        let loaded = 0 
        found_mp3.forEach( (f) => { 
            this.construct_mp3(f) 
            loaded++ 
        }) 
        // console.log("Video:") 
        // found_video.forEach( (f) => { 
        //     console.log(f)
        // }) 
        this.construct_playgroups() 
        return loaded 
    }

    // private static load_disk( src_pth : string ) { 

    // } 

    // private static save_disk( out_path : string ) { 

    // } 

    // private static save_dimg( out_path : string ) { 
    //     // all we need is the indexer object 
    // } 

    private static construct_playgroups() {
        let gp_att_keys = [ "album" , "artist", "plst" ] 
        let gp_constructors : Function[] = [ Playable.playgroup.const_album , Playable.playgroup.const_discog , Playable.playgroup.const_plst ] 
        
        let new_gc : number = 0 
        gp_att_keys.forEach( (k) => { 
            new_gc += Object.keys(Library.indexed_atts[k]).length 
        }) 
        new_gc -= Library.group_count 
        if ( new_gc == 0 ) { return; } 

        gp_att_keys.forEach( (k,i) => { 
            Object.keys(Library.indexed_atts[k]).forEach( (gp) => { 
                if ( Filter.Filterable.query_l1_filterable[k+":&"+gp+";type:&track;"] == undefined ) { 
                    gp_constructors[i].call(Playable.playgroup, gp)
                    new_gc-- 
                } 
            }) 
        }) 
        // Library.load_complete_callback.call(null, 0)    
    }
    
    static new_playable( new_p : Playable.playable) { 
        // console.log(new_p.uid)
        if ( new_p.uid == undefined ) { 
            throw new Error("Must request UID before calling new_playable")
        }
        this.playable_into_indexer(new_p, Library.indexed_atts )
        if ( new_p.supertype =="group" ) { 
            Library.group_count++ 
        } else { 
            // Library.loaded_s++ 
        } 
        Filter.Filterable.root.add_to_filter_tree(new_p) 
        // let req_uid : number = uid == undefined ? Library.count++ : uid 
        if (Library.uid_playable[new_p.uid] == undefined ) {
            Library.uid_playable[new_p.uid] = new_p 
        } else { 
            throw new Error("Playable called new_playable with bad uid") 
        } 

        // if ( !Library.loaded && Library.awaiting_load == Library.loaded_s + Library.loaded_f ) { 
        //     Library.loaded = true 
        //     Library.construct_playgroups() 
        //     Library.load_complete_callback.call(null, [Library.loaded_s]) 
        // } else { 
        //     // console.log("Awaiting : " + Library.awaiting_load + ", Loaded : " + Library.loaded_s + ", Failed: " + Library.loaded_f )
        // }
        // return req_uid
    }

    static request_uid( ) : number { // allows playables to get a uid before construction is complete 
        let req_uid : number = Library.count++ 
        // console.log(req_uid) 
        return req_uid
    } 

    static playable_into_indexer( new_p : Playable.playable, indexer : { [id:string] : { [id:string] : Playable.playable[] } } ) { 
        let atts : string[] = Library.indexed_atts_keys 
        if ( indexer === Library.indexed_atts && Library.items.includes(new_p) ) { 
            throw new Error("Duplicate into indexer") 
        } 
        atts.forEach( (att : string) => {
            if ( Object.keys(new_p).includes(att) && Object(new_p)[att] == null  ) { 
                return 
            } 
            let irec : Record<string, Playable.playable[]> = indexer[att] 
            if ( irec == undefined ) { 
                indexer[att] = {} as { [id:string] : Playable.playable[] } 
                irec = indexer[att] 
            }
            let raw_atvs : any = Object(new_p)[att]
            let atvs : Array<string> // note playables have single and array properties 
            if ( Array.isArray(raw_atvs) ) {  
                if (raw_atvs.length == 0) { return; } 
                atvs = raw_atvs 
            } else { 
                if ( raw_atvs == undefined || raw_atvs == "") { return;} 
                atvs = [raw_atvs] 
            } 
            atvs.forEach( ( atv : string ) => { // ie a track with two artists should appear in both artists records 
                let i = Library.disallowed_name_chars.length - 1 
                for( i; i >= 0; i-- ) { 
                    if ( atv.indexOf(Library.disallowed_name_chars[i]) != -1 ) { 
                        throw new Error("Disallowed char in playable indexer: " + att + ":" + atv ) 
                    }
                }
                if ( ! Object.keys(irec).includes(atv) ) { 
                    irec[atv] = [new_p]
                } else { 
                    let cuid = new_p.uid 
                    if ( cuid != undefined ) { 
                        irec[atv].forEach( (i) => { 
                            if ( i.uid == cuid ) { 
                                throw new Error("Tried to double-add playable " + cuid + " to indexer" )
                            }
                        }) 
                    }
                    irec[atv].push(new_p)
                }
            }) 
                
        });
    }

    static playable_pass_query( play : Playable.playable, query : Playable.get_playable_i ) : boolean { 
        let qats : string[] = Object.keys(query)
        // let pass : boolean = true 
        let i = qats.length -1 
        while (i >= 0 ) { 
            let qat = qats[i] 
            let qatv : string  
            if ( ( qatv = Object(query)[qat] ) == undefined ) { 
                i--
                continue 
            } 
            qatv = qatv.toLocaleLowerCase() 
            let atvs : any 
            if ( (atvs = Object(play)[qat]) == undefined ) { 
                return false 
            }
            if ( !Array.isArray(atvs) ) { 
                atvs = [atvs] 
            }
            qatv = qatv.replace('&', '').replace('|','') 
            if (qatv.length == 0 ) { 
                throw new Error("Invalid query value" + Object(query)[qat] ) 
            } 
            // console.log(atvs + " ?= " + qatv ) 
            let partial : boolean = qatv.charAt(0) == '*'  
            let pass = false  
            let j = atvs.length - 1 
            // console.log(j) 
            while ( j >= 0 ) { 
                let atv : string = atvs[j].toString() 
                if ( partial ) { 
                    qatv = qatv.slice(1) 
                    if (qatv.length == 0 ) { 
                        throw new Error("Invalid query value" + Object(query)[qat] ) 
                    } 
                    if ( atv.includes(qatv) ) { 
                        pass = true 
                        break; 
                    }
                } else { 
                    if ( atv.toLocaleLowerCase() == qatv ) { 
                        pass = true 
                        break; 
                    } 
                }
                j-- 
            }
            if (!pass ) { 
                return false 
            } 
            i--
        } 
        return true 
    }

    static construct_mp3(src_path : string ) { 
        if ( src_path == undefined ) { 
            throw new Error("Undefined passed to MP3 constructor")
        } 
        
        let artists = ["Unknown Artist"] 
        let track_num : number = 0 
        let title : string = "Untitled" 
        let genre : string = "Unknown Genre" 
        let album : string = "Unknown Album" 
        let img_path : string = "../assets/_default.png" 
        // let length : string = "0:00" 

        let tags : any = id3.read(src_path) 
        if ( tags != undefined ) { 
            // console.log(tags["raw"]) 
            let tags_o : any = Object(tags) 
            let  artist : string 
            
            if ( (artist = tags_o["artist"]) != undefined ) { 
                artists = artist.split(';') 
            } 
            if ( tags_o["album"] != undefined ) { 
                album = tags_o["album"] 
            } 
            if ( tags_o["trackNumber"] != undefined ) { 
                track_num = parseInt(tags_o["trackNumber"])
                if ( isNaN(track_num) ) { 
                    track_num = 0 
                } 
            } 
            if ( tags_o["title"] != undefined ) { 
                title = Library.sanatize_pb_atts(tags_o["title"]) 
            } 
            if ( tags_o["genre"] != undefined ) { 
                genre = Library.sanatize_pb_atts(tags_o["genre"]) 
            } 
            if ( tags_o["image"]["imageBuffer"] != undefined ) { 
                let image : NativeImage = nativeImage.createFromBuffer(tags_o["image"]["imageBuffer"]) 
                img_path = image.toDataURL() 
            } 
   
        } 

        let fbuf : Buffer = fs.readFileSync(src_path) 
        let duration : number = Math.floor(get_mp3_dur(fbuf) / 1000) 
        // console.log(duration) 
        // length = Display.length_str(duration) 
        let fblob : Blob = new Blob([fbuf]) 
        let howl : Howl = new Howl({ 
            src: URL.createObjectURL(fblob), 
            preload: false, 
            html5: true, 
            format : "mp3", 
            onloaderror: this.load_err, 
        })

        if (artists[0].length == 0 ) { 
            artists[0] = "Unknown Artist"
        } 
        artists = artists.map( (s) => { 
            return Library.sanatize_pb_atts(s).trim() 
        }) 

        if ( title == "Untitled"  ) { 
            title = Library.sanatize_pb_atts(src_path.split(path.sep).pop().split('.')[0]) 
        }
        title = Library.sanatize_pb_atts(title) 
        // new LibraryItem("track", title, artists, album, genre, track_num, src_path, img_path, length, howl )
        let uid : number = Library.request_uid() 
        this.path_uid[src_path] = uid
        Library.new_playable({ 
            type:"track", 
            supertype:"", 
            name:title, 
            length_s:duration, 
            track_num:track_num, 
            genre:genre, 
            album:album, 
            artist:artists,
            image_path:img_path,     
            howl:howl,        
            uid:uid
        })  
    } 

    static load_err(sid : any, err : string) { 
        //@ts-ignore 
        console.log("Load error for " + sid + " : " + err ) 
        
        // @ts-ignore 
        let err_uid = Library.path_uidt[his._src] //"this" is not the library, its a howl (??) 
        console.log(err_uid) 
        if ( err_uid == undefined ) { 
            return 
        } 
        Filter.Filterable.prune(err_uid) 
        // // this_libitm.is_error = true // may not be nesecary 
        // Library.loaded_f++ 
    } 

    // static lib_itm_toSting(): string { 
    //     let ret = this.name 
    //     if ( this.artist != undefined ) { 
    //         ret += " by " 
    //         this.artist.forEach( (n : string, new_p : number) => { 
    //             if ( new_p > 0 ) { 
    //                 ret += " and " 
    //             }
    //             ret += n 
    //         })  
    //     } 
    //     if ( this.album != undefined && this.album != "" ) { 
    //         ret += " on the album " + this.album 
    //     }
    //     return ret 
    // } 

    static sanatize_pb_atts(atv : string) : string { 
        if ( atv == undefined ) { 
            return "" 
        } 
        let ret = atv 
        let i = Library.disallowed_name_chars.length - 1 
        for( i; i >= 0; i-- ) { 
            if ( atv.indexOf(Library.disallowed_name_chars[i]) != -1 ) { 
                ret = ret.replace(this.disallowed_name_chars[i], '')
            }
        }
        // console.log(ret) 
        return ret 
    } 

    static update_settings( src : settings ) { 
        let src_obj = Object(src) 
        let set_obj = Object(this.settings) 
        let prop : any 
        [ "root_dir" , "recurse", "follow_symlinks" ].forEach( (k) => { 
            if ( ( prop = src_obj[k] ) != undefined ) { 
                set_obj[k] = src_obj[k] 
            } 
        } ) 
        
    } 

    static get_settings() : settings { 
        return { 
            root_dir: this.settings.root_dir, 
            follow_symlinks: this.settings.follow_symlinks, 
            recurse : this.settings.recurse, 
        } 
    } 

}
