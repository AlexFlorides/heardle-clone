import React from "react"
import Mark from "mark.js"
import Result from "./Result"
import skippedImg from "../assets/skipped.png"
import wrongImg from "../assets/wrong.png"

export default function Game(props){

    const [songs, setSongs] = React.useState([])
    const [query, setQuery] = React.useState("")
    const [visibility, setVisibility] = React.useState("hidden")
    const [songSeconds, setSongSeconds] = React.useState(1000)
    const [numSkips, setNumSkips] = React.useState(0)
    const [isSkipped, setIsSkipped] = React.useState([
        false, false, false, false, false, false
    ])
    const [isWrong, setIsWrong] = React.useState([
        false, false, false, false, false, false
    ])
    const [skipSeconds, setSkipSeconds] = React.useState(1)
    const [btnSrc, setBtnSrc] = React.useState("play_btn.png")
    const [loadSeconds, setLoadSeconds] = React.useState("00")
    const [guessTitleBackground, setGuessTitleBackground] = React.useState({
        guess_title_0: "none",
        guess_title_1: "none",
        guess_title_2: "none",
        guess_title_3: "none",
        guess_title_4: "none",
        guess_title_5: "none",
    })
    const [isGameOver, setIsGameOver] = React.useState(false)
    const [isSuccessfulGuess, setIsSuccessfulGuess] = React.useState(false)
    const [selectedSong, setSelectedSong] = React.useState("")

    const controller = new AbortController()
    const markInstance = new Mark(document.getElementById('grid-layout'));
 
    const song = React.useMemo(() => new Audio(props.todaysSong.preview), [props.todaysSong.preview]);
    const interval = React.useRef(null)

    const options = {
        method: 'GET',
        headers: {
            'content-type': 'application/octet-stream',
            'X-RapidAPI-Key': process.env.REACT_APP_RAPID_API_KEY,
            'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
        }
    };

    async function getSearchSongs(query, signal) {

        async function presentResults(query){
            return new Promise(async(resolve, reject) => {

                if (signal?.aborted){
                    reject(signal.reason)
                }
            
                const apiUrl = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${query}`;
    
                try {
                    const res = await fetch(apiUrl, options);
                    const data = await res.json()
        
                    if (data.data !== undefined){
                        resolve(data.data)
                    }
                    
                } catch (error) {
                    reject(error);
                }
            })
        }

        try {
            const search_results = await presentResults(query)
 
            var songResults = []
            
            search_results.forEach(x => {
                if (!songResults.some(e => e.title_short.includes(x.title_short) && e.artist_id === x.artist.id)){
                    songResults.push({title_short: x.title_short, artist: x.artist.name, artist_id: x.artist.id})
                }
            })
            
            setSongs(songResults)
    
            const container = document.getElementById("grid-layout");

            if (container != null){
    
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
    
                for (var i=0; i<songResults.length; i++){
                    const div = document.createElement("div");
                    div.id = "song-" + i
                    div.className = "grid-layout-song";
                    var songTitleArtist = songResults[i].title_short + " - " + songResults[i].artist
                    div.innerText = songTitleArtist
                    container.appendChild(div);
                }
    
                if (container.firstChild){
                    setVisibility("visible")
                }
            }

            markInstance.unmark()
            markInstance.mark(query)

        } catch(e){
            return
        }
        
    }

    // Define debounce function
    const debounce = (fn, delay = 500) => { 
        let timerId = null; 
        return (...args) => { 
            clearTimeout(timerId); 
            timerId = setTimeout(() => fn(...args), delay); 
        }; 
    };

    // Create a debounced version of the getSearchSongs function
    const debouncedApiCall = debounce(getSearchSongs);

    React.useEffect(() => {
        const signal = controller.signal

        if (query.length === 0){
            setSongs([])
            setVisibility("hidden")
            return
        }

        debouncedApiCall(query, signal);

        return () => {
            controller.abort("cancel")
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    // hide search results when clicking outside input element
    // else show it again only when there are already results
    // and the input search box is not empty
    React.useEffect(() => {

        const handleSongClick = (e) => {
            e.preventDefault()
            e.stopPropagation()
       
            setVisibility("hidden")

            var song_id = e.currentTarget.id.split("-")[1]
            if (songs[song_id] != null){
                var song_title = songs[song_id].title_short + " - " + songs[song_id].artist
                setSelectedSong(song_title)
                document.getElementById("search-input").value = selectedSong
            }
        }

        const handleInput = (e) => {
            e.preventDefault()
            e.stopPropagation();

            if (songs.length > 0 && query.length > 0){
                setVisibility("visible")
            }
            else {
                setVisibility("hidden")
            }
        }

        var songElements = document.getElementsByClassName("grid-layout-song");
        document.getElementById("search-input").addEventListener("click", handleInput)

        for (var i=0; i<songElements.length; i++) {
            songElements[i].addEventListener("click", handleSongClick);
        }

        return () => {
            for (var i=0; i<songElements.length; i++) {
                songElements[i].removeEventListener("click", handleSongClick);
            }
            document.getElementById("search-input").removeEventListener('click', handleInput)
        }
    }, [query, songs, selectedSong])

    // update query based on users input
    function inputChange(value){
        if (value != null){
            setQuery(value)
            setSelectedSong("")
        }
        else {
            setSelectedSong(selectedSong)
        }
    }

    function previewSong(){

        setLoadSeconds("00")

        if (!song.paused){
            song.pause()
            song.currentTime = 0
            setBtnSrc("play_btn.png")
            setLoadSeconds("00")
            clearInterval(interval.current)
            interval.current = null
            return
        }

        song.pause()
        song.currentTime = 0

        function loadTimeBar() {
            interval.current = setInterval(time, 1000)

            function time(){

                setLoadSeconds((prevLoadSeconds) => {
                    var secs = parseInt(prevLoadSeconds)
                    secs += 1
                    if (secs < 10){
                        secs = "0" + secs
                    }
                    if (secs >= songSeconds/1000){
                        clearInterval(interval.current)
                        interval.current = null
                        setBtnSrc("play_btn.png")
                    }
                    return secs
                })
            }
        }
        
        var playPromise = song.play()

        if (playPromise !== undefined){
            playPromise.then(function() {
                setBtnSrc("pause_btn.png")
                loadTimeBar()
                setTimeout(() => { 
                    song.pause(); 
                }, songSeconds);
            })
            .catch(error => {
                console.log(error)
            })
        }
    }

    // on Skip button click, increase songs playtime, buttons seconds
    // and fill respective progress bar and increase
    function skipSongSeconds(skipped){

        var guess_title = document.getElementById("guess_title_" + numSkips)

        var skip_icon = skippedImg

        if (skipped){ 
            guess_title.value = "SKIPPED"
            setIsSkipped( prevIsSkipped => {
                const result = [...prevIsSkipped];
                result[numSkips] = true;
                return result;
            })
        }
        else {
            var song_selected = document.getElementById("search-input").value
            guess_title.value = song_selected
            skip_icon = wrongImg
        }

        setGuessTitleBackground( prevGuessTitleBackground => ({
            ...prevGuessTitleBackground,
            ["guess_title_" + numSkips]: skip_icon
        }))

        song.pause()
        song.currentTime = 0
        setBtnSrc("play_btn.png")
        setLoadSeconds("00")
        clearInterval(interval.current)
        interval.current = null

        if (numSkips === 5){
            setIsGameOver(true)
            return
        }

        var elem2 = document.getElementById("time-2");
        var elem3 = document.getElementById("time-3");  
        var elem4 = document.getElementById("time-4");
        var elem5 = document.getElementById("time-5");  
        var elem6 = document.getElementById("time-6");

        setNumSkips((prevNumSkips) => {
            var newNumSkips = prevNumSkips + 1

            if (newNumSkips === 0){
                setSongSeconds(1000)
                setSkipSeconds(1)
            }
            else if (newNumSkips === 1){
                setSongSeconds(2000)
                setSkipSeconds(2)
                elem2.style.width = '100%';
            }
            else if (newNumSkips === 2){
                setSongSeconds(4000)
                setSkipSeconds(3)
                elem3.style.width = '100%';
            }
            else if (newNumSkips === 3){
                setSongSeconds(7000)
                setSkipSeconds(4)
                elem4.style.width = '100%';
            }
            else if (newNumSkips === 4){
                setSongSeconds(11000)
                setSkipSeconds(5)
                elem5.style.width = '100%';
            }
            else if (newNumSkips === 5){
                setSongSeconds(16000)
                elem6.style.width = '100%';
            }

            return newNumSkips
        })     
    }

    function submitAnswer(){
        var song = document.getElementById("search-input").value

        if (song.trim().length === 0){
            skipSongSeconds(true)
            return
        }

        var song_title = song.split("-")[0] != null ? song.split("-")[0].trim() : ""
        var song_artist = song.split("-")[1] != null ? song.split("-")[1].trim() : ""

        var todays_song_title = props.todaysSong.title_short
        var todays_song_artist = props.todaysSong.artist.name

        if (song_title === todays_song_title && song_artist === todays_song_artist){
            setIsGameOver(true)
            setIsSuccessfulGuess(true)
        }
        else {
            skipSongSeconds()
            setIsWrong( prevIsWrong => {
                const result = [...prevIsWrong];
                result[numSkips] = true;
                return result;
            })
        }
    }

    function seeTodaysAnswer(){
        setIsSkipped( prevIsSkipped => {
            for (var i=numSkips; i<7; i++){
                prevIsSkipped[i] = true
            }
            return prevIsSkipped;
        })
        setIsGameOver(true)
    }

    if (!isGameOver){
        return (
            <div>
                <div className="game-guess-title">
                    <input id="guess_title_0" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_0 !== "none" ? "url("+guessTitleBackground.guess_title_0+")" : "none"}} />
                    <input id="guess_title_1" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_1 !== "none" ? "url("+guessTitleBackground.guess_title_1+")" : "none"}} />
                    <input id="guess_title_2" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_2 !== "none" ? "url("+guessTitleBackground.guess_title_2+")" : "none"}} />
                    <input id="guess_title_3" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_3 !== "none" ? "url("+guessTitleBackground.guess_title_3+")" : "none"}} />
                    <input id="guess_title_4" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_4 !== "none" ? "url("+guessTitleBackground.guess_title_4+")" : "none"}} />
                    <input id="guess_title_5" type="text" disabled style={{backgroundImage: guessTitleBackground.guess_title_5 !== "none" ? "url("+guessTitleBackground.guess_title_5+")" : "none"}} />
                </div>
                <div className="game-main">
                    <div className="outer-container">
                        <div className="inner-container">
                            <div className="game-time">
                                <span className="game-time-grid" >
                                    <div id="time-1" style={{width:"100%"}} className="game-time-grid-loaded"></div>
                                </span>
                                <span className="game-time-grid" >
                                    <div id="time-2" className="game-time-grid-loaded"></div>
                                </span>
                                <span className="game-time-grid" >
                                    <div id="time-3" className="game-time-grid-loaded"></div>
                                </span>
                                <span className="game-time-grid" >
                                    <div id="time-4" className="game-time-grid-loaded"></div>
                                </span>
                                <span className="game-time-grid" >
                                    <div id="time-5" className="game-time-grid-loaded"></div>
                                </span>
                                <span className="game-time-grid" >
                                    <div id="time-6" className="game-time-grid-loaded"></div>
                                </span>
                            </div>
                            <div className="game-time-play">
                                <p>0:{loadSeconds}</p>
                                <img 
                                    className="game-play-btn" 
                                    src={require("../assets/"+btnSrc)} 
                                    alt="play button" 
                                    width="40" 
                                    height="40" 
                                    onClick={previewSong}
                                />
                                <p>0:16</p>
                            </div>
                            <div className="game-guess-title">
                                <div 
                                    id="grid-layout" 
                                    className="grid-layout" 
                                    style={{visibility:visibility}}>
                                </div>
                                <input 
                                    id="search-input" 
                                    type="text" 
                                    placeholder="Know it? Search for the artist / title"
                                    onChange={event => inputChange(event.target.value)}
                                    value={selectedSong !== "" ? selectedSong : query}
                                />
                            </div>
                            <div className="game-buttons">
                                <button className="skip-btn" onClick={() => skipSongSeconds(true)}>
                                    {numSkips === 5 ? "SKIP" : `SKIP (+${skipSeconds})`}
                                    </button>
                                <button className="submit-btn" onClick={submitAnswer}>SUBMIT</button>
                            </div>
                            <span className="todays-answer-btn" onClick={seeTodaysAnswer}>See today's answer</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    else {
        return <Result 
            todaysSong={props.todaysSong} 
            songSeconds={songSeconds} 
            isSuccessfulGuess={isSuccessfulGuess} 
            numSkips={numSkips}
            isSkipped={isSkipped}
            isWrong={isWrong}
        />
    }
    
}