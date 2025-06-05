import { useEffect, useState } from 'react';
import './Cards.css';

export default function Cards(props){
    const [jogos, setJogos] = useState([]);

useEffect(() => {
  fetch(`http://127.0.0.1:8080/api/games`)
    .then((response) => response.json())
    .then(data => {
      const jogosOrdenados = data.sort((a, b) => b.rating - a.rating);
      setJogos(jogosOrdenados);
      console.log(jogosOrdenados);
    })
    .catch(error => console.error('Não foi possível buscar os jogos', error));
}, []);


    return(
        <li>
            {jogos.map((jogo) =>(
                <div className="card-Ma" key={jogo}>
                    <div className="jogo-poster">
                        <img src={jogo.background_image} alt="" />
                    </div>
                    <div className="jogo-infos">
                        <p className="jogo-name">{jogo.name}</p>
                        <p className='jogo-nota'>
                            <span class="material-symbols-outlined star">
                                star
                            </span>{jogo.rating}
                        </p>

                        <div className="hidden-content">
                            <p className='description'></p>
                            <button className="btn-default">Ver mais</button>
                        </div>
                    </div>
                </div>
                
            ))}
        </li>
        
    )
}