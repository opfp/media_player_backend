import * as Playable from "./playable"
import * as LIB from "./library" 
import * as Filter from "./filter"

import {Howl} from "howler" 

// const Playable = require("playable") 
// const LIB = require("library") 
// const Filter = require("filter") 

import { nativeImage, NativeImage } from "electron"

function get_attr(base : Playable.playable, anm : string ) : string { 
    let atv : any 
    if ( (atv = Object(base)[anm]) != undefined ) { 
        if ( Array.isArray(atv) ) { 
            return atv.join(", ") 
        } else { 
            return atv 
        } 
    } else { 
        return "" 
    }
}

export function length_str(length_s : number ): string { 
    let minutes = Math.floor(length_s / 60) 
    length_s -= ( minutes * 60 ) 
    let min_str = minutes.toString() 
    if ( min_str.length < 1 ) { 
        min_str = '0' + min_str
    } 
    
    let sec_str = Math.floor(length_s).toString() 
    if ( sec_str.length < 2 ) { 
        sec_str = '0' + sec_str
    } 
    return min_str + ":" + sec_str 
}
// }

export class DisplayRow { 
    static uid_row : { [id:number] : DisplayRow } = { }
    
    name : string 
    length : string 
    artist : string 
    album : string 
    // index : number 
    // idx_str : string 
    // context : PlayContext
    readonly base : Playable.playable 
    readonly base_uid : number 
    readonly image_path : string 

    // update_row_is_playing : Function 

    dot_functions : { [id:string] : Function } = { 
        "Add to queue" : this.add_to_queue, 
        "Add to queue next" : this.add_to_queue_next
    } 

    constructor(base : Playable.playable) { 
        let base_aso = Object(base) // TODO : rewrite to cover up my stupidity 
        if ( DisplayRow.uid_row[base_aso["uid"] ] != undefined ) { 
            throw new Error("Tried to double construct DisplayRow for a playable. Make sure to check DisplayRow.uid_row for already constructed playables") 
        } 
        
        this.base = base 
        this.base_uid = base_aso["uid"]
        this.name = base_aso["name"] 
        if ( base.length_s == undefined ) { 
            this.length = "Length Unknown"
        } else { 
            // console.log(base.length_s) 
            this.length = length_str(base.length_s) 
        }
        this.image_path = base.image_path == undefined ? "../assets/_default.png" : base.image_path 
        // console.log(base.artist) 
        this.artist = base_aso["artist"] == undefined || base.artist[0] == undefined ? "Unknown Artist" : base.artist[0] 
        this.album = base_aso["album"]  == undefined ? "Unkown Album" : base.album
        // this.context = context
        // this.index = index  
        // this.idx_str = (index + 1).toString() 
        if ( this.album != undefined ) { 
            this.dot_functions["Go to Album"] = this.go_to_album 
        } else { 
            // console.log("undef album for: "  + this.name ) 
        }
        if ( this.artist != undefined ) { 
            this.dot_functions["Go to Artist"] = this.go_to_artist 
        } else { 
            // console.log("undef artist for: " + this.name ) 
        } 
        DisplayRow.uid_row[this.base_uid] = this 
    }

    play(context : PlayContext ) { 
        PlayContextManager.play_refactor_queue(context, context.uid_inx[this.base_uid]) 
    } 

    add_to_queue() { 
        PlayContextManager.add_to_queue(this) 
    } 

    add_to_queue_next() { 
        PlayContextManager.add_to_queue_next(this) 
    }

    go_to_artist() { 
        if ( this.artist == undefined ) { 
            console.log("go_to_artist called on row with undefined artist: " + this.name) 
            return 
        } 
        let query : string = "artist:&"+this.artist+";type:&track;"
        let new_flt : Filter.Filterable
        if ( ( new_flt = Filter.Filterable.query_l1_filterable[query] ) != undefined ) { 
            PlayContextManager.event_change_viewcontext(new_flt.playcontext) 
        } else  { 
            console.log("No Filterable for artist: " + this.artist ) 
        } 
        
        // PlayContextManager.event_change_viewcontext(Filter.Filterable.query_l1_filterable["artist:&"+this.artist+";type:&track;"].playcontext)
    } 

    go_to_album() { 
        if ( this.album == undefined ) { 
            console.log("go_to_album called on row with undefined album: " + this.name) 
            return 
        } 
        let query : string = "album:&"+this.album+";type:&track;"
        let new_flt : Filter.Filterable
        if ( ( new_flt = Filter.Filterable.query_l1_filterable[query] ) != undefined ) { 
            PlayContextManager.event_change_viewcontext(new_flt.playcontext) 
        } else  { 
            console.log("No Filterable for album: " + this.album ) 
        } 
    } 

    // set_index(i : number) { 
    //     this.index = i 
    //     this.idx_str = (i+1).toString() 
    // } 

    // toString(context : PlayContext ) : string { 
    //     return (context.uid_inx[this.base_uid]+1).toString() + " " +  this.name + ( this.album == "" ? "" : " | " + this.album ) + " | " + this.artist + " | " + this.length 
    // } 

    toString() : string { 
        return this.name + ( this.album == "" ? "" : " | " + this.album ) + " | " + this.artist + " | " + this.length 
    } 

    //TODO : add to playlist 


    // image : small_image 
}

// export class DisplayRowTrack extends DisplayRow { 
//     base : LIB.LibraryItem  
//     constructor( base : LIB.LibraryItem ) { 
//         super(base) 
//         this.base = base 
//     } 

//     play() { 
//         this.base.howl.play() 
//     } 
// } 

export interface modify_header { 
    name : string 
    type ?: string 
    // is_mutable : boolean 
    image ?: NativeImage 
    artist ?: string 
    description ?: string 
    release_date ?: string 
    edit_date ?: string 
} 

export class DisplayHeader { 
    //@ts-ignore 
    name : string 
    type ?: string 
    length : string = ""
    // is_mutable : boolean 
    image : NativeImage = LIB.Library.default_cover
    artist ?: string 
    description ?: string 
    release_date ?: string 
    edit_date ?: string 
    // src_uid : number = -1 

    static uid_header : { [id:number] : DisplayHeader } = {}

    constructor( src : modify_header ) { 
        // this.name = src.name 
        // this.type = src.type 
        // if ( src.image != undefined ) { this.image = src.image } 

        Object.keys(src).forEach( (k) => { 
            let at : any 
            if ( (at = Object(src)[k] ) != undefined ) { 
                Object(this)[k] = at 
            } 
        }) 

        // this.length = src.length_ms length_str(src.length_ms) 
        this.artist = Object.keys(src).includes('artist') ? Object(src)['artist'] : undefined 
        // if ( this.type == "playlist" ) { //TODO add playlist specific features 

        // } 
    } 

} 

// export class display_box { 
//     name : string 
//     length : string 
//     artist : string 
//     // image : large_image 
// }

// export interface sort_display_row { 
//     name ?: string 
//     artist ?: string 
//     album ?: string 
//     track_number ?: number  
// } 

export class PlayContext { 
    static uid_playcontext : { [id:number] : PlayContext } = {} 

    header : DisplayHeader
    rows : DisplayRow[] = []
    readonly mutable : boolean = false 
    uid_inx : { [id:number] : number } = {} 
    // src_uid : number 

    sort_by ?: string 
    sort_asc : boolean = true 


    constructor( src : Filter.Filterable | PlayContext | DisplayHeader, mutable ?: boolean, starti ?: number ) { 
        if ( mutable ) { 
            this.mutable = true 
        } 
          
        if ( src instanceof Filter.Filterable ) { 
            this.header = src.header
            // this.src_uid = src.uid
            src.items.forEach( (itm : Playable.playable, idx: number ) => { 
                let row : DisplayRow 
                if ( ( row = DisplayRow.uid_row[itm.uid] ) == undefined ) { 
                    row = new DisplayRow(itm)
                    DisplayRow.uid_row[itm.uid] = row 
                }
                this.rows.push(row ) 
                this.uid_inx[row.base_uid] = idx 
            })
        } else if ( src instanceof DisplayHeader ) { //Object.keys(src).includes("image") ) { 
            this.header = src 
            // this.src_uid = src.
        } else { // copy constructor 
            // console.log(") 
            if ( starti == undefined ) { 
                starti = 0 
            } else if ( starti < 0 || starti >= src.rows.length ) { 
                throw new Error("Invalid index passed to PlayContext copy constructor: " + starti ) 
            }
            // if ( is_queue ) { 
            //     // console.log("Queue construct") 
            //     this.header = PlayContextManager.queue_header 
            // } else { 
            //     this.header = src.header 
            // } 
            this.header = src.header 
            // this.src_uid = src.src_uid
            console.log(starti)
            this.rows = src.rows.slice(starti, src.rows.length ).concat(src.rows.slice(0,starti) ) 
            this.rows.forEach( (r,i) => { 
                this.uid_inx[r.base_uid] = i
            }) 
        } 


    }
    
    // todo: notify view of changes 
    insert_tail( row: DisplayRow) { 
        //@ts-ignore 
        if ( !this.mutable || Object.keys(this.uid_inx).includes(row.base_uid) ) { return; } 
        this.rows.push(row) 
        this.uid_inx[row.base_uid] = this.rows.length - 1 
    } 

    insert_head( row : DisplayRow ) { 
        //@ts-ignore 
        if ( !this.mutable || Object.keys(this.uid_inx).includes(row.base_uid) ) { return; }        
        this.rows.unshift(row) 
        //@ts-ignore 
        Object.keys(this.uid_inx).forEach ( (k:number) => { 
            this.uid_inx[k] = this.uid_inx[k] +1 
        })
        this.uid_inx[row.base_uid] = 0 
    } 

    insert( row : DisplayRow ) { 
        //@ts-ignore 
        if ( Object.keys(this.uid_inx).includes(row.base_uid) ) { return; } 
        if ( this.sort_by == undefined || this.rows.length < 1 ) { 
            this.rows.push(row) 
            this.uid_inx[row.base_uid] = this.rows.length - 1 
            return 
        } 
        let i : number = this.sort_asc ? 0 : this.rows.length - 2 
        let inc : number = this.sort_asc ? 1 : -1 
        let atv : string = Object(row)[this.sort_by] 
        while ( Object(this.rows[i])[this.sort_by] < atv ) { 
            i += inc 
        } 
        this.rows = this.rows.slice(0,i).concat(row).concat(this.rows.slice(i,this.rows.length) )
        i++ 
        while ( i < this.rows.length ) { 
            this.uid_inx[this.rows[i].base_uid] = i 
        } 

    } 

    move ( old_i : number, new_i : number, ct : number ) { 
        if ( !this.mutable || old_i == new_i || ct < 1 ) { return; } 
        //TODO : rewrite without branch 
        let low : number = (new_i > old_i) ? new_i : old_i 
        let high : number = (new_i < old_i) ? new_i : old_i 
        let pkg  : DisplayRow[] 
        let cent : DisplayRow[] 
        this.rows = [] 
        this.rows.concat(this.rows.slice(0,high), //TODO : rewrite so "high" doesnt mean the low index rows 
            new_i > old_i ? (pkg = this.rows.slice(old_i,old_i+ct) ) : ( cent = this.rows.slice(high,old_i) ), 
            new_i > old_i ? this.rows.slice(high,old_i) : this.rows.slice(old_i,old_i+ct)  , 
            this.rows.slice(low, this.rows.length ) )  
        
        let i : number = 0 
        // for( i; i < this.rows.length; i++ ) { 
        //     this.rows[i].index = i 
        // } 

        // if ( new_i > old_i ) { //shift up 
        //     let temp_head : DisplayRow[] = this.rows.slice(0,new_i) // everything which is still above after insert 
        //     let temp_tail : DisplayRow[] = this.rows.slice(old_i+ct, this.rows.length ) // everything which is after before 
        //     let temp_cnt : DisplayRow[] = this.rows.slice(new_i,old_i+ct+1) // remember end is excluded (see: ^)   
        //     return this.rows.concat(temp_head, this.rows.slice(old_i, old_i + ct), temp_cnt, temp_tail ) 
        // } else { //shift down 

        // } 
        // this.update_mainview.call() 
    }

    sort( attr: string, ascending ?: boolean  ) { 
        if (! Playable.playgroup.playable_sortables.includes(attr) ) { 
            throw new Error("Cannot sort playables by " + attr ) 
        } 
        let asc = ( ascending == undefined) || ascending ? true : false 
        this.rows.sort( (a,b) => { 
            // console.log(Object(a.base)[attr] + " ? " + Object(b.base)[attr] ) 
            let dif : number = Object(a.base)[attr] > Object(b.base)[attr] ? 1 : -1
            // console.log(dif) 
            return asc ? dif : -dif 
        }) 
        this.uid_inx = {} 
        this.rows.forEach((r,i) => { 
            // console.log(i + " " + r.name) 
            this.uid_inx[r.base_uid] = i 
            // console.log(i + " " + this.uid_inx[r.base_uid] ) 
        })
        this.sort_by = attr 
        this.sort_asc = asc 
    } 

    toString() : string { 
        let ret : string = this.header.name + ( this.header.type == undefined ? "" : (" : " + this.header.type ) )
        this.rows.forEach( (r,i) => { 
            ret += "\n\t" + (i+1) + " : " + r.toString() 
        })
        return ret 
    } 

    refresh(updaded_rows : Playable.playable[]) { 
        this.rows = [] 
        this.uid_inx = {} 
        updaded_rows.forEach( (itm : Playable.playable , idx: number ) => { 
            let row : DisplayRow 
            if ( ( row = DisplayRow.uid_row[itm.uid] ) == undefined ) { 
                row = new DisplayRow(itm)
                DisplayRow.uid_row[itm.uid] = row 
            }
            this.rows.push(row ) 
            this.uid_inx[row.base_uid] = idx 
            this.uid_inx[row.base_uid] = idx 
        })
        if ( PlayContextManager.current_view === this ) { 
            PlayContextManager.update_mainview_pctx.call(undefined, this) 
        } 
    } 
}

export class Queue extends PlayContext { 
    // uid_inx: { [id: number]: number } = null 
    last_played : DisplayRow[] = [] 

    constructor() { 
        super( new DisplayHeader({name:"Queue", image:LIB.Library.nativeImage.createFromPath(LIB.Library.root_dir+"/assets/_queue.png")}) )
    } 

    insert(row: DisplayRow) {
        this._insert(row, false) 
        // console.log(row.toString() + " into queue" ) 
    }

    insert_head(row: DisplayRow) {
        this._insert(row, true) 
    }

    insert_tail(row: DisplayRow) {
        this._insert(row, false) 
    }

    private _itail(row : DisplayRow ) { 
        //@ts-ignore 
        Object.keys(this.uid_inx).forEach( (uid: any) => { 
            this.uid_inx[uid]++ 
        }) 
        this.uid_inx[row.base_uid] = 0 
    } 

    _insert(row: DisplayRow, athead : boolean) {
        // console.log(row.base_uid) 
        if ( this.uid_inx[row.base_uid] != undefined ) { 
            // console.log("duplicate into queue rejected") 
            return 
        } 
        if ( row.base.type == "track" ) { 
            // let row_ta : DisplayRow = DisplayRow.uid_row[row.base.uid] 
            // if (row_ta = undefined ) { 
            //     row_ta = new DisplayRow(row) 
            // } 
            if ( athead ) { 
                this._itail(row) 
            } else { 
                this.uid_inx[row.base_uid] = this.rows.length 
                this.rows.push(row) 
            }
        } else if ( row.base instanceof Filter.Filterable ) { 
            let filts_totrav : Filter.Filterable[] = [row.base]
            for ( let i = 0; i < filts_totrav.length; i++ ) { 
                filts_totrav[i].items.forEach( (itm) => { 
                    if ( itm instanceof Filter.Filterable ) { 
                        filts_totrav.push(itm) 
                    } else { 
                        let row_ta : DisplayRow = DisplayRow.uid_row[itm.uid] 
                        if (row_ta = undefined ) { 
                            row_ta = new DisplayRow(itm) 
                        }  
                        if ( athead ) { 
                            this._itail(row_ta) 
                        } else { 
                            this.uid_inx[row.base_uid] = this.rows.length 
                            this.rows.push(row)    
                        }  
                    } 
                })
            } 
        } else { 
            throw new Error("Wrong type passed to Queue _insert")   
        } 
    }

    play() { 
        if (this.rows.length == 0 ) { 
            PlayContextManager.event_toggle_play(false) 
            return 
        } 
        if (this.rows[0] == undefined ) { 
            throw new Error("Undefined element in queue") 
        } 
        let new_row = this.rows.shift() 
        if ( new_row == undefined ) { 
            PlayContextManager.is_playing = false 
            return
        } 
        let idx = this.last_played.length-1
        
        if ( PlayContextManager.current_sound != undefined ) { 
            PlayContextManager.current_sound.stop() 
        }   

        this.last_played.push(new_row) 
        //@ts-ignore 
        let this_howl : Howl = new_row.base.howl 
        if ( this_howl.state() != "loaded" ) { 
            this_howl.load(); 
        } 
        this_howl.play() 
        PlayContextManager.current_sound = this_howl
        if ( PlayContextManager.update_current_row != undefined ) { 
            PlayContextManager.update_current_row.call(undefined, new_row) 
            // console.log("Called change current playing state hook: " + new_row.base_uid) 
            // PlayContextManager.set_current_playing_uid_obj = new_row.base_uid
        } else { 
            console.log("set_current_playing_uid undefined") 
        }

        this_howl.on('end', function() { PlayContextManager.privileged_queue.play(); } )
        this.balance_load() 
        PlayContextManager.event_toggle_play(true) 
    } 

    rewind( ) { 
        if  ( this.last_played[0] == undefined ) { 
            return 
        }
        this.rows.unshift(this.last_played.pop())
        let new_row = this.last_played.pop() 
    
        if ( new_row != undefined ) { 
            this.rows.unshift(new_row) 
            this.play() 
        } else { 
            PlayContextManager.is_playing = false 
        }
    } 

    balance_load() { 
        let lamb = ["loaded", "unloaded"] 
        let l = this.last_played.length  
        let i = l 
        let buf = LIB.Library.buffer_size 
        let k : number = 0
        let this_howl : Howl 
        while ( --i >= 0 ) { 
            if ( i + buf == l ) { 
                k = ++k % 2 
            } 
            //@ts-ignore 
            if ( (this_howl = this.last_played[i].base.howl).state() != lamb[k] ) { 
                (k % 2 == 1 ? this_howl.unload : this_howl.load).call(this_howl) 
                console.log( "lb: " + lamb[k] + " element " + i + " in last_played" ) 
            } 
        } 
        l = this.rows.length 
        while ( ++i < l ) { 
            if ( i == buf + 1 ) { 
                k = ++k % 2 
            } 
            //@ts-ignore 
            if ( (this_howl = this.rows[i].base.howl).state() != lamb[k] ) { 
                (k % 2 == 1 ? this_howl.unload : this_howl.load).call(this_howl) 
                console.log( "lb: " + lamb[k] + " element " + i + " in queue" ) 
            } 
        } 

    } 

} 

export class PlayContextManager { 
    // static queue : PlayContext //TODO : impliment privileged / regular queue 
    static privileged_queue : Queue 
    static recents : PlayContext[] = [] 
    static recents_upstream : PlayContext[] = [] 
    static current_view : PlayContext 
    static current_sound : Howl 
    // static uid_pctx_tb_update : { [key:number] : PlayContext } = {}  
    
    static library_ctx: PlayContext 
    static library_tracks_ctx : PlayContext 
    static albums_ctx : PlayContext 
    static artists_ctx : PlayContext
    static plsts_ctx : PlayContext  
   
    static update_mainview_pctx : Function 
    static update_current_row : Function
    static update_playstatus : Function 

    static is_playing : boolean = false 
    static shuffle : boolean = false 
    static loop_playack : boolean = false 
    static last_rr : number 

    static init_playcontext_manager() { 
        // PlayContextManager.queue_header = new DisplayHeader( {name:"Queue", image:LIB.Library.nativeImage.createFromPath(LIB.Library.root_dir+"/assets/_queue.png")} )
        
        let library_tracks_header : DisplayHeader = new DisplayHeader( {name:"Songs in Your Library"} )
        this.library_tracks_ctx = new PlayContext(new Filter.Filterable({make_root:false, 
            query:{type:"&track"}, header:library_tracks_header}))
        this.current_view = this.library_tracks_ctx
        
        // this.queue = new PlayContext(this.queue_header, true) 
        this.privileged_queue = new Queue()  
        
        PlayContextManager.albums_ctx = new PlayContext( new Filter.Filterable({make_root:false, query:{type:"&album"}, header: new DisplayHeader( {name:"Albums in Your Library"} ) }) )

        PlayContextManager.artists_ctx = new PlayContext( new Filter.Filterable( { make_root:false, query:{type:"&discog"}, header: new DisplayHeader( {name:"Artists in Your Library"}) } ) ) 
    }

    static play_refactor_queue( from_context : PlayContext, index : number ) { 
        if ( this.current_sound != undefined ) { 
            this.current_sound.stop() 
        } else { 
            PlayContextManager.event_toggle_play(true) 
        } 
        this.privileged_queue = new Queue() 
        let i : number = index 
        if (PlayContextManager.shuffle ) { 
            let added_idxs : { [id:number] : boolean } = { }
            added_idxs[i] = true 
            this.privileged_queue.insert(from_context.rows[i]) 
            let l : number = from_context.rows.length - 1 
            let j : number = l - 1 
            while ( j > 0 ) { 
                let k : number = Math.floor(Math.random() * l )
                // console.log(j) 
                if ( added_idxs[k] == undefined ) { 
                    // console.log(k) 
                    added_idxs[k] = true 
                    this.privileged_queue.insert(from_context.rows[k]) 
                    j-- 
                } 
            } 
        } else {     
            while ( i < from_context.rows.length ) { 
                this.privileged_queue.insert(from_context.rows[i++])
            } 
            if ( index > 0 ) { 
                i = 0 
                while ( i < index ) { 
                    this.privileged_queue.insert(from_context.rows[i++])
                } 
            } 
        } 
        this.privileged_queue.play() 
    } 
    
    static add_to_queue( row : DisplayRow)  { 
        this.privileged_queue.insert_tail(row) 
    } 

    static add_to_queue_next( row : DisplayRow ) { 
        this.privileged_queue.insert_head(row) 
    } 

    static event_toggle_play( status ?: boolean ) { 
        this.is_playing = status == undefined ? !this.is_playing : status 
        if ( PlayContextManager.update_playstatus != undefined ) { 
            PlayContextManager.update_playstatus.call(undefined, this.is_playing)
        } else { 
            console.log("update_playstatus not set") 
        } 
    } 

    static event_pause() { 
        if ( this.current_sound == undefined ) { 
            this.event_toggle_play(false) 
            return
        } 
        if ( this.current_sound.playing() ) { 
            this.current_sound.pause() 
        } else { 
            this.current_sound.play() 
        } 
        this.event_toggle_play() 
    } 

    static event_ff() { 
        this.privileged_queue.play() 
    } 

    static event_rr() { 
        let this_time = new Date().getTime() 
        if ( this_time - this.last_rr > 500 ) { 
            this.current_sound.play() 
        } else { 
            this.privileged_queue.rewind() 
        }
    } 

    static event_toggle_shuffle() { 
        this.shuffle = !this.shuffle
    }

    static event_toggle_loop_playback(){ 
        this.loop_playack = !this.loop_playack 
    } 

    static event_change_viewcontext( new_c : PlayContext ) { 
        this.recents.push(this.current_view)  
        this.current_view = new_c 
        this.update_mainview_pctx.call(undefined, this.current_view) 
    } 

    static event_goto_last_context( ) { 
        if ( this.recents.length < 1 || this.recents[0] === this.current_view ) { 
            console.log("rexit (should never trigge)") 
            return 
        } 
        this.recents_upstream.push(this.current_view) 
        this.current_view = this.recents.pop() 
        this.update_mainview_pctx.call(undefined, this.current_view) 
    } 

    static event_goto_next_context() { 
        if ( this.recents.length < 1 || this.recents_upstream[this.recents_upstream.length-1] === this.current_view ) { 
            console.log("rentry") 
            return 
        } 
        if ( this.recents_upstream.length < 1 ) { 
            return
        }
        this.recents.push(this.current_view)
        this.current_view = this.recents_upstream.pop()
        this.update_mainview_pctx.call(undefined, this.current_view) 
    } 

}
