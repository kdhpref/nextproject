import Image from 'next/image';

export default function MovieInfo({ movie }: { movie: any }) {
  return (
    <div>
      <h2 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        {movie.title}
      </h2>
      <div className="flex gap-8 mt-4">
        <Image
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          width={300}
          height={450}
          className="rounded-md"
        />
        <div>
          <p className="text-lg">{movie.overview}</p>
          <p className="mt-4">
            <span className="font-semibold">Release Date:</span>{' '}
            {movie.release_date}
          </p>
          <p>
            <span className="font-semibold">Rating:</span> {movie.vote_average}
          </p>
        </div>
      </div>
    </div>
  );
}
