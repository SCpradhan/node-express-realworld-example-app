ALTER TABLE "Article"
  ADD CONSTRAINT "Article_title_length_check" CHECK (char_length("title") <= 255);

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_slug_length_check" CHECK (char_length("slug") <= 255);
