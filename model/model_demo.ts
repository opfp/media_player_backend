import * as LIB from "./library"
import * as Filter from "./filter" 
import * as Display from "./display" 

export function model_test() { 
    Filter.Filterable.init() 
    // directory, recursive (true if undefined) 
    console.log("Awaiting library load") 
    LIB.Library.init_lib("C:/Users/micha/Desktop/Fall 2022/CS 1530 Software Eng/MP3s", true),// model_test) 

    Display.PlayContextManager.init_playcontext_manager()     
    // let current_view = Display.PlayContextManager.current_view 
    // let queue = Display.PlayContextManager.privileged_queue
    
    // console.log("Before sort") 
    // console.log(Display.PlayContextManager.current_vieSw.toString()) 
    
    Display.PlayContextManager.current_view.sort("artist") 
    // Display.PlayContextManager.event_toggle_shuffle() 
    console.log(Display.PlayContextManager.current_view.toString()) 
    // Display.PlayContextManager.current_view.rows[25].play(Display.PlayContextManager.current_view) 

    // console.log(Display.PlayContextManager.privileged_queue.toString()) 

    // let local_copy : Display.PlayContext = Display.PlayContextManager.current_view
    // console.log(Object.keys(Filter.Filterable.query_l1_filterable))

   
    // console.log("Local copy:") //local copy will not update
    // console.log(local_copy.toString()) 
    
    // console.log("American Wedding -> go to artist") 
    // Display.PlayContextManager.current_view.rows[66].go_to_artist() 
    // console.log(Display.PlayContextManager.current_view.toString())
    
    // console.log("Add Marvin's room to queue") 
    // current_view.rows[6].add_to_queue() 
    // console.log(queue.toString())
    
    // console.log("Add Drive slow to head of queue") 
    // current_view.rows[3].add_to_queue_next() 
    // console.log(queue.toString())
    
    // console.log("Begin playing from " + current_view.rows[5].name + " in Library") 
    // current_view.rows[5].play(current_view) 
    // console.log(Display.PlayContextManager.privileged_queue.toString()) 
    
    // console.log("Marvin's room -> go to album")
    // current_view.rows[6].go_to_album() 
    // console.log(Display.PlayContextManager.current_view.toString())
    
    // console.log("Albums playcontext") 
    // console.log(Display.PlayContextManager.albums_ctx.toString() )
    
    // console.log("Artists playcontext") 
    // console.log(Display.PlayContextManager.artists_ctx.toString() )
} 


