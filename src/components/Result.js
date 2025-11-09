import React from "react"
import MidnightTimer from "./MidnightTimer"

export default function Result(props){

    var todaysSong = props.todaysSong
    const interval = React.useRef(null)
    const song = React.useMemo(() => new Audio(todaysSong.preview), [todaysSong.preview]);
    const [btnSrc, setBtnSrc] = React.useState("play_btn.png")

    var seconds = props.songSeconds / 1000
    var second_word = seconds === 1 ? "second" : "seconds"
    var result_description = "Unlucky!"
    var result_comment = `You didn't get today's Heardle. \n Better luck tomorrow!`

    var result_box_class = ["", "", "", "", "", ""]

    for (var i=0; i<props.isWrong.length; i++){
        if (props.isWrong[i]){
            result_box_class[i] = "wrong"
        }
    }

    for (var k=0; k<props.isSkipped.length; k++){
        if (props.isSkipped[k]){
            result_box_class[k] = "skipped"
        }
    }

    if (props.isSuccessfulGuess){
        result_description = "A virtuoso performance!"
        result_comment = `You got today's Heardle within ${seconds} ${second_word}`
        result_box_class[props.numSkips] = "correct"
    }

    function openDeezer(){
        window.open("https://www.deezer.com", "_blank")
    }

    function openFacebook(){
        window.open("https://www.facebook.com", "_blank")
    }

    function playPreview(){
        // const song = new Audio(todaysSong.preview);   
        console.log(todaysSong, song.paused)
        
        if (!song.paused){
            song.pause()
            song.currentTime = 0
            setBtnSrc("play_btn.png")
            clearInterval(interval.current)
            interval.current = null
            return
        }

        song.pause()
        song.currentTime = 0

        var playPromise = song.play()

        if (playPromise !== undefined){
            playPromise.then(function() {
                setBtnSrc("pause_btn.png")
                setTimeout(() => { 
                    song.pause(); 
                    setBtnSrc("play_btn.png")
                }, todaysSong.duration * 100);
            })
            .catch(error => {
                console.log(error)
            })
        }
    }

    return (
        <div>
            <div className="result-screen">
                <div className="result-song">
                    <img 
                        src={(`${todaysSong.album.cover}`)} 
                        alt="result album cover" 
                        width="150" 
                        height="150" 
                        className="result-album-cover"
                    />

                    <h2 className="result-song-title">{todaysSong.title_short}</h2>
                    <p className="result-text">{todaysSong.artist.name}</p>
                </div>

                <h2 className="result-desc">{result_description}</h2>

                <div className="result-boxes">
                    <span id="result-box-1" className={`result-box ${result_box_class[0]}`}></span>
                    <span id="result-box-2" className={`result-box ${result_box_class[1]}`}></span>
                    <span id="result-box-3" className={`result-box ${result_box_class[2]}`}></span>
                    <span id="result-box-4" className={`result-box ${result_box_class[3]}`}></span>
                    <span id="result-box-5" className={`result-box ${result_box_class[4]}`}></span>
                    <span id="result-box-6" className={`result-box ${result_box_class[5]}`}></span>
                </div>
                
                <p className="result-text result-comment">{result_comment}</p>

                <img 
                    className="game-play-btn game-buttons" 
                    src={require("../assets/" + btnSrc)} 
                    alt="play button" 
                    width="40" 
                    height="40" 
                    onClick={playPreview}
                />
                <div className="game-buttons">
                    <button className="listen-deezer-btn" onClick={openDeezer}>Listen on Deezer</button>
                </div>

                <p className="result-share" onClick={openFacebook}>Share</p>
                <MidnightTimer />
                
            </div>
        </div>
    )
}