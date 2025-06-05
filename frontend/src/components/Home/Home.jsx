import Navbar from '../Navbar/Navbar';

export default function Home({ onEntrarClick }) {
  return (
    <>
      <Navbar onEntrarClick={onEntrarClick} />
      <main>
        {/* Conteúdo da homepage */}
      </main>
    </>
  );
}
