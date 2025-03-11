/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect, useCallback } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import './styles.css';

// Offline-first Chess Tournament Management App
function ChessTournamentManager() {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedTournaments = JSON.parse(localStorage.getItem('chess-tournaments') || '[]');
    setTournaments(savedTournaments);
  }, []);

  // Create a new tournament
  const createTournament = (name) => {
    const newTournament = {
      id: Date.now(),
      name,
      date: new Date().toLocaleDateString(),
      players: []
    };
    const updatedTournaments = [...tournaments, newTournament];
    setTournaments(updatedTournaments);
    localStorage.setItem('chess-tournaments', JSON.stringify(updatedTournaments));
    setCurrentTournament(newTournament);
    setCurrentRound(0);
  };

  // Add a player to current tournament
  const addPlayer = (name, rating) => {
    if (!currentTournament) return;
    const newPlayer = {
      id: Date.now(),
      name,
      rating: rating || 0,
      score: 0,
      isRated: rating && rating > 0
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    localStorage.setItem(`tournament-players-${currentTournament.id}`, JSON.stringify(updatedPlayers));
  };

  // Generate tournament pairings using custom algorithm
  const generatePairings = () => {
    const updatedRound = currentRound + 1;
    setCurrentRound(updatedRound);

    // First round: Prioritize rated vs unrated
    if (updatedRound === 1) {
      const ratedPlayers = players.filter(p => p.isRated);
      const unratedPlayers = players.filter(p => !p.isRated);
      
      const newMatches = [];
      
      // Pair rated with unrated first
      const minLength = Math.min(ratedPlayers.length, unratedPlayers.length);
      for (let i = 0; i < minLength; i++) {
        newMatches.push({
          id: Date.now() + i,
          player1: ratedPlayers[i],
          player2: unratedPlayers[i],
          result: null,
          round: updatedRound
        });
      }

      // If extra rated or unrated players, pair them among themselves
      if (ratedPlayers.length > minLength) {
        for (let i = minLength; i < ratedPlayers.length; i += 2) {
          if (ratedPlayers[i + 1]) {
            newMatches.push({
              id: Date.now() + i,
              player1: ratedPlayers[i],
              player2: ratedPlayers[i + 1],
              result: null,
              round: updatedRound
            });
          }
        }
      }

      if (unratedPlayers.length > minLength) {
        for (let i = minLength; i < unratedPlayers.length; i += 2) {
          if (unratedPlayers[i + 1]) {
            newMatches.push({
              id: Date.now() + i,
              player1: unratedPlayers[i],
              player2: unratedPlayers[i + 1],
              result: null,
              round: updatedRound
            });
          }
        }
      }

      setMatches(newMatches);
      localStorage.setItem(`tournament-matches-${currentTournament.id}`, JSON.stringify(newMatches));
    } else {
      // Subsequent rounds: Sort by current score
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      const newMatches = [];

      for (let i = 0; i < sortedPlayers.length; i += 2) {
        if (sortedPlayers[i + 1]) {
          newMatches.push({
            id: Date.now() + i,
            player1: sortedPlayers[i],
            player2: sortedPlayers[i + 1],
            result: null,
            round: updatedRound
          });
        }
      }

      setMatches(newMatches);
      localStorage.setItem(`tournament-matches-${currentTournament.id}`, JSON.stringify(newMatches));
    }
  };

  // Record match result and update player scores
  const recordMatchResult = (matchId, result) => {
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        return {...match, result};
      }
      return match;
    });

    // Update player scores based on match result
    const updatedPlayers = players.map(player => {
      const matchInvolved = updatedMatches.find(
        m => m.id === matchId && (m.player1.id === player.id || m.player2.id === player.id)
      );

      if (matchInvolved) {
        const isPlayer1 = matchInvolved.player1.id === player.id;
        switch(result) {
          case 'player1':
            return {
              ...player, 
              score: player.score + (isPlayer1 ? 1 : 0)
            };
          case 'player2':
            return {
              ...player, 
              score: player.score + (isPlayer1 ? 0 : 1)
            };
          case 'draw':
            return {
              ...player, 
              score: player.score + 0.5
            };
          default:
            return player;
        }
      }
      return player;
    });

    setMatches(updatedMatches);
    setPlayers(updatedPlayers);

    localStorage.setItem(`tournament-matches-${currentTournament.id}`, JSON.stringify(updatedMatches));
    localStorage.setItem(`tournament-players-${currentTournament.id}`, JSON.stringify(updatedPlayers));
  };

  return (
    <div className="chess-tournament-app">
      <header>
        <h1>Offline Chess Tournament Manager</h1>
      </header>
      
      <main>
        {!currentTournament ? (
          <section className="tournament-setup">
            <input 
              type="text" 
              placeholder="Tournament Name" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') createTournament(e.target.value);
              }}
            />
          </section>
        ) : (
          <div className="tournament-management">
            <section className="player-registration">
              <h2>{currentTournament.name}</h2>
              <div className="add-player">
                <input 
                  type="text" 
                  placeholder="Player Name" 
                  id="playerName"
                />
                <input 
                  type="number" 
                  placeholder="Rating (optional)" 
                  id="playerRating"
                />
                <button onClick={() => {
                  const nameEl = document.getElementById('playerName');
                  const ratingEl = document.getElementById('playerRating');
                  addPlayer(nameEl.value, parseInt(ratingEl.value));
                  nameEl.value = '';
                  ratingEl.value = '';
                }}>
                  Add Player
                </button>
              </div>
              
              <div className="players-list">
                <h3>Players ({players.length})</h3>
                {players.map(player => (
                  <div key={player.id} className="player-card">
                    {player.name} (Rating: {player.rating}, Score: {player.score})
                  </div>
                ))}
              </div>
            </section>

            <section className="tournament-pairings">
              <button onClick={generatePairings}>Generate Round {currentRound + 1} Pairings</button>
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-players">
                    {match.player1.name} vs {match.player2.name}
                  </div>
                  <div className="match-result">
                    <button onClick={() => recordMatchResult(match.id, 'player1')}>
                      {match.player1.name} Wins
                    </button>
                    <button onClick={() => recordMatchResult(match.id, 'draw')}>
                      Draw
                    </button>
                    <button onClick={() => recordMatchResult(match.id, 'player2')}>
                      {match.player2.name} Wins
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section className="scoreboard">
              <h3>Scoreboard</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...players]
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                    <tr key={player.id}>
                      <td>{index + 1}</td>
                      <td>{player.name}</td>
                      <td>{player.rating}</td>
                      <td>{player.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return <ChessTournamentManager />;
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}

if (typeof document !== "undefined") { client(); }

export default async function server(request) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scholar's Chess Tournament Manager</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 20px; 
          }
          .chess-tournament-app {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .player-registration, .tournament-pairings, .scoreboard {
            margin-top: 20px;
          }
          .add-player {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          }
          .player-card, .match-card {
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
          }
          .match-result {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
          }
          button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
          }
          input {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}