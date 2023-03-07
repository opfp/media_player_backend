import * as Playable from "./playable" 
import * as LIB from "./library"
import * as Display from "./display" 

// const Playable = require("playable") 
// const LIB = require("library") 
// const Display = require("display") 

export interface filterable_construct_fromlib { 
    make_root : boolean 
    query ?: Playable.get_playable_i
    header ?: Display.DisplayHeader  
    l1_src_uid ?: number 
} 

export interface filterable_contstruct_branch { 
    base : Filterable 
    query : Playable.get_playable_i
} 

export class Filterable { 
    static root : Filterable //= new Filterable(LIB.Library) 
    static is_rooted : boolean = false 
    static uid_l1_filterable : {[id:number] : Filterable } = {}
    static query_l1_filterable : { [id:string] : Filterable } = {} 
    // static filterable_playcontext : { Filterable : Display.PlayContext } 
    //tree vars 
    is_root : boolean = false 
    is_factored  : boolean = false 
    height : number = -1  
    upstream : Filterable | null = null 
    downstream : Filterable[] = []  
    uid : number = -1 
    // content vars 
    private readonly query : Playable.get_playable_i = {} 
    items : Playable.playable[] = []
    length_s : number = 0 
    private indexed_atts : { [id:string] : { [id:string] : Playable.playable[] } } = {}
    header : Display.DisplayHeader 
    playcontext : Display.PlayContext 

    static init( ) { 
        if ( Filterable.is_rooted ) { return; } 
        new Filterable({make_root:true}) 
        // if (! LIB.Library.toy_data_added ) { LIB.Library.init_lib(); } 
        Filterable.is_rooted = true 
    }

    static prune(n_uids : number[] ) { 
        if ( ! this.is_rooted ) { 
            console.log("Cannot prune un-rooted Filterable tree") 
            return 
        } 
        let nodes_toex : Filterable[] = [this.root] 
        let r = false 
        nodes_toex.forEach( (n : Filterable) => {        
            let new_rows : Playable.playable[] = n.items.map( (p) => { 
            if ( !n_uids.includes(p.uid) ) { 
                return p 
            } 
            r = true 
            }) 
            if (r) { 
                n.playcontext.refresh(new_rows) 
                n.downstream.forEach( (d) => { nodes_toex.push(d); })  
            } 
        }) 

    } 

    // constructor(  query ?: Playable.get_playable_i, i_base ?: Filterable | LIB.Library) { 
    constructor( args : filterable_construct_fromlib | filterable_contstruct_branch ) { 
        let base : Filterable 
        let header : Display.DisplayHeader 
        if ( 'make_root' in args ) { // construct from lib 
            if ( args.make_root && !Filterable.is_rooted ) { 
                Filterable.root = this 
                this.is_root = true 
                this.height = 0 
                this.items = LIB.Library.items
                this.indexed_atts = LIB.Library.indexed_atts 
                this.upstream = null 
                this.header = LIB.Library.libray_header 
                this.playcontext = new Display.PlayContext(this) 
                Display.PlayContextManager.library_ctx = this.playcontext
                return 
            } else if ( args.make_root ) { 
                throw new Error("Filterable tree already rooted, cannot re-make root")   
            } else if ( args.query == undefined || args.header == undefined ) { 
                throw new Error("Query, Header requried to construct height 1 filterable" ) 
            } else if ( Filterable.root == undefined ) { 
                throw new Error("Filterable tree must be rooted before any other filterables may be constructed")
            }
            this.header = args.header 
            base = Filterable.root 
            this.uid = args.l1_src_uid == undefined ? -1 : args.l1_src_uid 
            Filterable.query_l1_filterable[Playable.query_toString(args.query)] = this 
            Filterable.uid_l1_filterable[this.uid] = this 
        } else { // branch down from l1 filterable 
            base = args.base 
            this.uid = base.uid
            this.header = args.base.header 
        } 
        //@ts-ignore 
        this.query = args.query 
        this.upstream = base 
        this.upstream.downstream.push(this) 
        this.height = base.height + 1 
        base.filter(this.query,this) 
        // Header info contains medatadata based on contents, which is not known at playable construction time 
        // as playable impliments filterable, but headers are constructed there because filterable relies on 
        // non root nodes (ie nodes created by filtering downstream from root) to have a header (as all height > 1 
        // nodes use their parents' header) 

        if ( this.height == 1 ) { // so we need to update header for l1 
            this.update_header() 
        } 
        this.playcontext = new Display.PlayContext(this) 
        // if (i_base instanceof LIB.Library ) { 
        //     Filterable.root = this 
        //     this.is_root = true 
        //     this.height = 0 
        //     this.items = LIB.Library.items
        //     this.indexed_atts = LIB.Library.indexed_atts 
        //     this.upstream = null 
        //     return 
        // } 
        // if (Filterable.root == undefined ) { 
        //     throw new Error("Filterable tree must be rooted before any other filterables may be constructed")
        // }
        // if ( query == undefined ) { 
        //     return 
        // }
        // this.query = query 
        // let base : Filterable 
        // if ( i_base == undefined ) { 
        //     base = Filterable.root 
        // } else { 
        //     base = i_base 
        // }
        // this.height = base.height + 1 
        // this.upstream = base
        // base.downstream.push(this)  
        // base.filter(query,this) 
    }

    private filter( query : Playable.get_playable_i, i_ret : Filterable ) : Filterable  { 
        let ret : Filterable = i_ret
        let atts : string[] = Object.keys(this.indexed_atts)
        atts.forEach( (i) => {
            if ( ! LIB.Library.indexed_atts_keys.includes(i) ) { 
                throw new Error("Search base_dict contains a key which is not a uniform libray indexer: " + i )
            }
        }) 
        // console.log(atts) 
        // let ret_newd = {} as { [id:string] : { [id:string] : Playable.playable[] } }
        // let ret_f : filterable = { query:query, indexed_atts:ret_newd, items:[], upstream:base, downstream:[], filter:get_playable() } 

        /*  
        "&" : force intersect. (Only allow return values which pass this query). Default where strict:true or strict:undefined. Guarentees the return is a subset of the answer to this query  
        "|" :   don't force intersect. used where strict:true or undefined to allow playables which don't meet criteria 
        "*" : partial matching 
        */ 
        let query_flags : {[id : string]:boolean | string} = { 
            "&" : (query.strict == undefined || query.strict ),
            "|" : "&",  // | toggles & 
            "*" : false 
        } 

        // let matches : [ [boolean, Array<Playable.playable> ] ] = []
        let matches : Array<[boolean, Array<Playable.playable>]> = [] 

        // Collect a set which matches each given att 
        atts.forEach( ( att : string ) => { // for each indexed attribute ( all also members of get_playable_i )         
            if ( Object(query)[att] == undefined ) {  
                return 
            }  
            // console.log(att) 

            // ret.indexed_atts[att] = {} as { [id:string] : Playable.playable[] }

            let qatv : string = Object(query)[att].toString()//.toLocaleLowerCase() // query attribute value (ie artist="Drake", att = artist, qatv = Drake)
            let att_rec  = this.indexed_atts[att]
            // let sect_match_cont : Playable.playable[] = [] // container for matches to query 
            // console.log(att_rec) 
            // parse flags in query 
            let head : string
            while ( true ) { 
                head = qatv.slice(0,1) 
                // console.log(head )
                if ( Object.keys(query_flags).includes(head) ){ 
                    if ( typeof(query_flags[head]) == "string" ) { 
                        // @ts-ignore 
                        query_flags[query_flags[head]] = ! query_flags[query_flags[head]] 
                    } else { 
                        query_flags[head] = true 
                    }
                    // qatv = head 
                } else { 
                    break
                }
                qatv = qatv.slice(1) 
                if ( qatv.length == 0 ) { 
                    throw new Error("Inavlid query: " + Object(query)[att])  
                }
            }

            // console.log(qatv) 

            let t_matches : Playable.playable[] = [] 
            
            if ( query_flags['*'] ) { // partial matching is O(n) 
                qatv = qatv.toLocaleLowerCase() 
                Object.keys(att_rec).forEach( ( atv : any ) => { 
                    // if ( atv ! instanceof String ) { return;  } 
                    let atv_l = atv.toLocaleLowerCase() 
                    if ( qatv.toLocaleLowerCase().includes(atv_l) ) { 
                        att_rec[atv].forEach( (new_p : Playable.playable ) => { 
                            t_matches.push(new_p)
                        })
                    } 
                })
            } else { // whereas strict is O(1)
                t_matches = this.indexed_atts[att][qatv] 
            }
            //@ts-ignore 
            matches.push([query_flags["&"], t_matches ])

            // console.log("\tFor attr " + att + " = " + qatv +  " found matches: " +  t_matches ) 
        })
        // console.log("Matches : " + matches) 
        // Intersect those sets and return 

        matches = matches.filter( (i) => { 
            return ( i != undefined && i[1] != undefined &&  i[1].length > 0 ) 
        }) 

        // console.log(matches.length) 

        if ( matches.length == 1 ) { 
            ret.items = matches[0][1]
        } 

        //TODO : more efficent intersection (https://javascript.plainenglish.io/typescript-intersection-best-practice-6a7de85bb2f1)
        //@ts-ignore 
        // matches = matches.filter( (m) => { 
        //     return ( Array.isArray(m[1]) && m[1].length > 0 ) 
        // }) 
        // matches = matches.sort((a,b) => { 
        //     return a[1].length - b[1].length
        // }) 
        // matches.forEach( (i) => { 
        //     console.log(i[1].length) 
        // }) 
        // would sorting matches matter for efficency? 
        matches.forEach( (set_c : [ boolean, Playable.playable[] ] ) => {  // intersect the sets. output guarenteed to be a subset of 
            // console.log(matches)                                         // all sets with true 
            let set : Playable.playable[] = set_c[1] 
            set.forEach( (new_p : Playable.playable ) => {
                if (ret.items.includes(new_p) ) { 
                    return 
                } 
                let pass = true 
                // let needle_uid : number = new_p.uid
                matches.forEach( (oset_c : [ boolean , Playable.playable[] ] ) => {
                    let oset : Playable.playable[] = oset_c[1] 
                    if ( set === oset || !oset_c[0]) { 
                        return; 
                    } 
                    if ( ! oset.includes(new_p) ) { 
                        pass = false 
                        return 
                    } 
                    // ret.items.forEach( (p : Playable.playable) => { 
                    //     if (p.uid == needle_uid ) { 
                    //         return 
                    //     } 
                    // })
                    // oset.forEach( (p: Playable.playable ) => { 
                    //     if (p.uid == needle_uid ) { 
                    //         pass = true 
                    //         return; 
                    //     }
                    // })
                })
                if ( pass ) { 
                    ret.items.push(new_p)
                    LIB.Library.playable_into_indexer(new_p, ret.indexed_atts) 
                }
            }) 
        }) 
        
        //@ts-ignore 
        ret.is_factored = true 
        ret.items.forEach((itm) => { 
            ret.length_s+=itm.length_s
        }) 
        // console.log("\tafter intersect: " + ret.items.join(" , "))
        return ret 
        
    }   

    add_to_filter_tree( new_p : Playable.playable ) { 
        if ( ! LIB.Library.playable_pass_query(new_p, this.query) ) { 
            return 
        } 
        if ( ! this.is_root ) { 
             LIB.Library.playable_into_indexer(new_p, this.indexed_atts) 
        }  
        this.items.push(new_p) 
        this.length_s += new_p.length_s
        if ( this.height ==1) { this.update_header(); } 
        let row : Display.DisplayRow = Display.DisplayRow.uid_row[new_p.uid] 
        if ( row == undefined ) { 
            row = new Display.DisplayRow(new_p) 
        }
        this.playcontext.insert(row) 
        this.downstream.forEach( (c) => { 
            c.add_to_filter_tree(new_p) 
        }) 
    } 

    update_header() { 
        this.header.length = Display.length_str(this.length_s)
    } 
    
    as_str_s() { 
        let ret = "Filterable at height " + this.height.toString() + " with " + this.items.length.toString() + " elems\n" 
        
        this.items.forEach( ( i : Playable.playable, j : number) => { 
            ret += j + "\t" + i.toString() + "\n"  
        }) 
        return ret 
    
    }

    // get_items() : Playable.playable[] { 
    //     let ret : Playable.playable[] = [] 
    //     this.items.forEach( (i) => { 
    //         ret.push( JSON.parse(JSON.stringify(i) ) as typeof Playable.playable 
    // }

}

// export class Playlist extends Filterable { 

// } 