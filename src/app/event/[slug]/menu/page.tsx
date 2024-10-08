"use client";

function MenuPage({ params }: { params: { slug: string } }) {
  return <span>{`Menu for ${params.slug}`}</span>;
}

export default MenuPage;
