# How to use the model to dynamically display, navigate and sort through PlayContexts 
**I am including only the classes, interfaces, attributes and functions which I believe are applicable to frontend developers** 
11/24/22 
### **SEE SRC/MAIN/LIBTEST For a demo on using the model** 
Import the required modules 
```
import * as LIB from "./library"
import * as Filter from "./filter" 
import * as Display from "./display" 
```
Note that the relative paths may be different. 

Then, init the Library. The library relies on Howls to load asynchronously, so you must await the library's loading before continuing. 

This is achieved by init_lib's third argument, a callback function which is called after loading is complete. 

In class Library 
```
static init_lib( root : string, recursive : boolean, callback ?: Function ) 
```
Calling init_lib 
``` 
LIB.Library.init_lib("/Users/owen/local_music", true, lib_afterload)
```
Function lib_afterload will be called after the library has loaded.

In function lib_afterload 
```
Display.PlayContextManager.init_playcontext_manager()     
```
The model is now fully initilized 

## The DisplayRow Class 
DisplayRows are the building block of the UI. They represent a playable.

Attributes: 
```
name : string 
length : string 
artist : string 
album : string 
readonly base_uid : number # A guaranteed unique ID which refers to this row, and its model playable object. 
dot_functions : { [id:string] : Function } 
```
Functions: 
```
play(PlayContext) 
add_to_queue() 
add_to_queue_next() 
go_to_artist()
go_to_album() 
```

`dot_functions` represents the avalible actions as user may take by right-clicking on the row, or clicking on a three-dot button on the right of the row. Where applicable, these will include `["Go to Album" : go_to_album ]` and `["Go to Artist" : go_to_artist" ]` 

Future: 

*Image Attribute* 

## The DisplayHeader Class 
DisplayHeaders contain metadata and images to be displayed to the user concerning the PlayContext they are viewing. Each PlayContext has exactly one DisplayHeader 

Attributes: 
```
name : string 
type ?: string 
length : string 
image : NativeImage 
artist ?: string 
description ?: string 
release_date ?: string 
edit_date ?: string 
```

Future: 

*go to artist/album, similar to DisplayRow* 

## The PlayContext Class 
PlayContexts are a container for DisplayRows, and they are also the context in which playaback occurs. The Queue, for instance, is a PlayContext (see the next section for details) 

Attributes: 
```
header : DisplayHeader 
rows : DisplayRow[] 
uid_idx : { [id:number] : number } # a dictionary which maps the displayrow uids to their index within this playcontext
```
Functions 
```
move ( old_i : number, new_i : number, ct : number )
sort( attr: string, ascending ?: boolean )
```
  
### The Queue class 
Queue is a subclass of PlayContext which enforces that all items in its rows[] field are LibraryItems (not PlayGroups). It impliments all of the above functionality, except it does not maintain a uid_idx dictionary (to allow(? - uid is an id for mapping in react) for a duplicate track in the queue).  
  
## The PlayContextManager Singleton Object 
This object is responsible for storing the current PlayContext to be displayed, as well as certian presisent PlayContexts like the Queue and Library (the "base" PlayContext) 

Attributes (all static): 
```
privileged_queue : Queue 
recents : PlayContext[] 
current_view : PlayContext 

library_ctx: PlayContext 
library_tracks_ctx : PlayContext 
albums_ctx : PlayContext 
artists_ctx : PlayContext 

queue_header : DisplayHeader 

is_playing : boolean 
shuffle : boolean 
loop_playack : boolean 
```
Functions (all static): 
```
play_refactor_queue( from_context : PlayContext, index : number )
add_to_queue( row : DisplayRow) 
add_to_queue_next( row : DisplayRow )
event_toggle_play()
event_toggle_shuffle()
event_toggle_loop_playback()
event_change_viewcontext( new_c : PlayContext )
event_ff() # fast forward 
event_rw() # rewind 
event_goto_last_context()
event_goto_next_context()
```
## Using the Model 
The UI should display a PlayContext in the main panel, and one or more the side panel. 
### The main panel 
At the top, the context's DisplayHeader object should be used to display an image, name, and lenth, along with description, date edited / published and artist (if applicable) 

Below the Header, the context's rows should be displayed in the same order as they are displayed in the array. Each rendered row should contaiain: index, name, artist / album (if applicable) a small image (TBI), and a "three dot" button which displays the row's dot functions

### The side panel 
The side panel will also make use of PlayContexts and display their rows, but the rendered rows will not make use of all the attributes in DisplayRow.

Rather, the side panel should display three sections, Albums, Artists and Playlists (TBI). Each will be a PlayContext, with the only attributes of import being the rows. These playgroups will be `PlayContextManager.albums_ctx` and `PlayContextManager.artists_ctx` (Playlists TBI). 

## Model Behavior
The Backend Filterable objects which underpin the PlayContexts are reactive to additions to the Library (no deletion support yet). When the filterables are automatically updated upon a new playable being added, they also update the PlayContexts to which they are attached. The UI should make use of a stake hook or other mechanism to itself update upon this happening. 

## Final Notes 
All classes also have a toString() for debuging. TS Will NOT automatically call this if you print one of these classes with `console.log()` You must call .toString yourself

## Future plans 
### Searching the Library (trivial) 
### Playlists 
Backend support for playlists has been added, but the frontent of the model still does not support creating or modifying them. 
### Item deletion in real time 
Would be pretty hard with current backend, and I fail to see a compelling use case for this. However, if the files disapper, trying to play them will not work out (perhaps just set length = 0 . . . ) 
