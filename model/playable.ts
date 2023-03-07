import { NativeImage } from "electron"
import * as Filter from "./filter" 
import * as LIB from "./library"
import * as Display from "./display" 
import { Howl } from "howler"

export interface playable { //TODO ~ how much of this can be made readonly? 
    readonly type : string 
    readonly supertype : string 
    name : string 
    artist ?: string[] 
    album ?: string 
    genre ?: string 
    length_s : number 
    track_num : number
    toString() : string   
    readonly uid : number  
    image_path ?: string 
    howl ?: Howl
    // load_comp : boolean 
}

export interface get_playable_i { 
    // base? : playgroup //| LibraryItem[] 
    name ?: string 
    type? : string 
    artist? : string // To match any member of playable.artist
    album? : string 
    genre? : number 
    strict ?: boolean 
    plst ?: string 
}

export interface modify_plst { 
    name ?: string 
    image ?: NativeImage 
    created ?: Date 
    edited ?: Date 
    //description : string 
} 

export function query_toString( query : get_playable_i ): string { 
    let ret : string = ""
    LIB.Library.indexed_atts_keys.forEach( (k) => { 
        let atv : any 
        if ( (atv = Object(query)[k]) != undefined ) { 
            let atvs : string[] 
            if ( Array.isArray(atv) ) { 
                atvs = atv 
            } else { 
                atvs = [atv] 
            } 
            ret += k + ":"+atvs.join(";")+";"
        }
    }) 
    return ret 
}               

 export class playgroup extends Filter.Filterable implements playable { 
    static playable_sortables : string[] = ["name", "artist", "album", "length_s", "track_num" ] 
    readonly type : string
    readonly supertype : string = "group" 
    readonly name : string 
    readonly uid : number 
    readonly track_num: number = -1 
    album?: string
    artist?: string[] 

    length : number = 0 

    constructor( type : string, query : get_playable_i, name : string, header_const : Display.modify_header, artist ?: string[], album ?: string) {         
        // console.log(query)
        query.type = "&track" 
        let uid : number = LIB.Library.request_uid() 
        let header : Display.DisplayHeader = new Display.DisplayHeader(header_const)
        super({make_root:false, query: query, header: header, l1_src_uid:uid})
        this.uid = uid 
        this.type = type 
        this.name = name 
        this.artist = artist
        this.album = album
        LIB.Library.new_playable(this) 
        // console.log(type + " " + artist + " : " + this.artist) 
    }

    toString() : string { 
        let ret = "" 
        ret += this.type + " : " + this.name 
        if ( Object.keys(this).includes("artist") ) { 
            ret += " by "  
            // @ts-ignore 
            this.artist.forEach( (n : string, i : number) => { 
                if ( i > 0 ) { 
                    ret += " and " 
                }
                ret += n 
            }) 
        }
        ret += "\n"  
        this.items.forEach( ( i : playable, j : number) => { 
            ret += j + "\t" + i.toString() + "\n"  
        }) 
        return ret 
    }

    // calc_length() : number { // shouldn't ever be called :\ 
    //     Filter.Filterable.uid_l1_filterable[this.uid].update_header() 
    //     return this.length_s 
    // } 

    static const_album(albm_name : string, image ?: NativeImage) { 
        if ( albm_name == undefined ) { 
            throw new Error("Cannot construct album with undefined name") 
        } 
        // else if (LIB.Library.indexed_atts["type"]["album"].includes(albm_name) ) { 
        //     throw new Error("Cannot make new album with name " + albm_name + " already taken" )
        // } 
        let header_const : Display.modify_header = {name:albm_name, type:"Album", image: image == undefined ? LIB.Library.default_cover : image} 
        
        new playgroup("album", {album:'&'+albm_name}, albm_name, header_const, undefined, albm_name)
    } 

    static const_discog(artist : string, image ?: NativeImage) { 
        if ( artist == undefined ) { 
            throw new Error("Cannot construct album with artist name") 
        } 
        // else if (Object.keys(LIB.Library.indexed_atts["type"]["artist"]).includes(artist) ) { 
        //     throw new Error("Cannot make new discography with artist name " + artist + " already taken" )
        // } 
        let header_const : Display.modify_header = {name:artist+"'s Discography", type:"Discography", image: image == undefined ? LIB.Library.default_cover : undefined} 

        let artist_a : string[] = [artist] 

        new playgroup("discog", {artist:'&'+artist}, artist + "'s Discography", header_const, artist_a )
    }

    static const_plst(uid_s : string) { 
        let uid : number = parseInt(uid_s) 
        if ( isNaN(uid) || LIB.Library.uid_playable[uid] != undefined ) { 
            throw new Error("Inavlid UID " + uid + " Passed to playlist constructor. It is either NaN or already in use")
        } 
        let base : modify_plst = LIB.Library.uid_plst_info[uid] 
        
        let header_const : Display.modify_header = {name: base.name == undefined ? "Unnamed Playlist" : base.name, type:"Playlist",image: base.image == undefined ? LIB.Library.default_cover : base.image} 

        new playgroup("plst", {plst:'&'+uid_s},base.name == undefined ? "Unnamed Playlist" : base.name ,header_const) 
    } 


}


// export class Album extendss playgroup{ 
//     readonly artist ?: string[] //TB Depreciated 
//     constructor( albm_name : string, image ?: NativeImage ){ 
//         let header_const : Display.modify_header = {name:albm_name, type:"Album", image: image == undefined ? LIB.Library.default_cover : image} 
//         super("album", {album:albm_name}, albm_name, header_const)
//         if ( this.items != undefined && this.items.length > 0 && this.items[0].artist != undefined && this.items[0].artist.length > 0 ) {  
//             this.artist = [this.items[0].artist[0]]
//             // this.header.artist = this.artist[0] 
//         }
//     }
// }

// export class Discography extends playgroup { 
//      readonly artist : string //TB Depriciated 
//      constructor(artist : string) { 
//         let image : undefined 
//         let header_const : Display.modify_header = {name:artist+"'s Discography", type:"Discography", image: image == undefined ? LIB.Library.default_cover : image} 

//         super("discog", {artist:artist}, artist + "'s Discography", header_const )
//         this.artist = artist 
//      }

// } 