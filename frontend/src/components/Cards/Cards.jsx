import { useEffect, useState } from 'react';
import './Cards.css';

export default function Cards({ filtro }){
    /* */
    const [jogos, setJogos] = useState([]);
    
    useEffect(() => {
        let url = `http://127.0.0.1:8080/api/games`;

        if (filtro?.tipo === 'ordenar') {
            url += `?ordering=${filtro.valor}`;
        } else if (filtro?.tipo === 'genero') {
            url += `?genres=${filtro.valor}`;
        }

        fetch(url)
            .then((response) => response.json())
            .then(response => setJogos(response))
            .catch(error => console.error('Não foi possível buscar os jogos', error));
        }, [filtro]);


    return(
        <li className='li-card'>
            {jogos.map((jogo) =>(
                <div className="card" key={jogo.id}>
                    <div className="jogo-poster">
                        <img src={jogo.background_image} alt={jogo.name} />
                    </div>
                    <div className="jogo-infos">
                        <p className="jogo-name">{jogo.name}</p>
                        <p className='jogo-nota'>
                            <span className="star">
                                ⭐
                            </span>{jogo.rating.toFixed(1)}
                        </p>
                    </div>
                </div>
                
            ))}
        </li>
        
    )
}