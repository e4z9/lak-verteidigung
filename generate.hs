#!/usr/bin/env stack
-- stack --install-ghc runghc --package turtle
{-# LANGUAGE OverloadedStrings #-}
import Turtle
import Prelude hiding (FilePath)
import qualified Data.Text as T

targets :: [Target]
targets = [handbuch, aktivitaet, meldung]

handbuch :: Target
handbuch = Target "handbuch" $ cpToDir "" [
    "handbuch/stylesheet.css"
  , "handbuch/rohstoffbrueckendetail.png"
  , "handbuch/brueckenburgen.png"
  ] ++ [
    genMarkdown "handbuch/HandbuchDerVerteidigung.md" "index.html"
  ]

aktivitaet :: Target
aktivitaet = Target "aktivitaet" [
    cpTo "aktivitaet/aktivitaet.html" ""
  ]

meldung :: Target
meldung = Target "meldung" $ cpToDir "meldung" [
    "meldung/site/index.html"
  , "meldung/site/app.js"
  , "meldung/site/burg-template.html"
  ] ++ cpTos [
    ("meldung/site/angular/angular.min.js",          "meldung/angular")
  , ("meldung/site/bootstrap/css/bootstrap.min.css", "meldung/bootstrap/css")
  , ("meldung/site/papaparse/papaparse.min.js",      "meldung/papaparse")
  ] ++ [
    pscBundle "meldung/script/output/**/*.js" ["Data.Attack"] "meldung/script.js"
  ]

-- src.md target.html
genMarkdown :: FilePath -> FilePath -> Operation
genMarkdown src target srcBase targetBase = do
  let (from, to) = (srcBase </> src, targetBase </> target)
  echoOp "multimarkdown" from to
  ensurePath to
  let srcFile = either id id $ toText from
  output to $ expandHead $ inproc "multimarkdown" [srcFile] empty
  where expandHead = sed ("<head>" *> return
                     ("<head>\n"
                     <> "<meta name=\"viewport\" content=\"width = device-width\"/><!-- scaling on iphone -->\n"
                     <> "<link rel=\"stylesheet\" href=\"stylesheet.css\" type=\"text/css\">"))

pscBundle :: Text -> [Text] -> FilePath -> Operation
pscBundle srcPattern modules target srcBase targetBase = do
  let to = targetBase </> target
  let srcBaseText = either id id $ toText srcBase
  let fromPattern = srcBaseText `T.append` "/" `T.append` srcPattern
  printf (fp % " <- psc-bundle " % s % "\n") to fromPattern
  ensurePath to
  let moduleArgs = do m <- modules; ["-m", m]
  output to $ inproc "psc-bundle" (fromPattern : moduleArgs) empty

-- BASE STUFF

-- srcBase targetBase
type Operation = FilePath -> FilePath -> IO ()

data Target = Target Text [Operation]
runTarget :: FilePath -> FilePath -> Target -> IO ()
--runTarget srcBase targetBase (Target _ ops) = sequence_ (($ targetBase) . ($ srcBase) <$> ops)
runTarget srcBase targetBase (Target _ ops) = sequence_ (ops <*> [srcBase] <*> [targetBase])

echoOp :: Text -> FilePath -> FilePath -> IO ()
echoOp name from to = printf (fp % " <- " % s % " " % fp % "\n") to name from

ensurePath :: FilePath -> IO ()
ensurePath = mktree . directory

cpTo :: FilePath -> FilePath -> Operation
cpTo src targetPath srcBase targetBase = do
  let (from, to) = (srcBase </> src, targetBase </> targetPath </> filename src)
  echoOp "cp" from to
  ensurePath to
  cp from to

cpTos :: [(FilePath, FilePath)] -> [Operation]
cpTos = fmap $ uncurry cpTo

cpToDir :: FilePath -> [FilePath] -> [Operation]
cpToDir target sources = liftA2 cpTo sources [target]

getBasePath :: [Text] -> IO (FilePath, [Text])
getBasePath [] = die "First argument must be base source path"
getBasePath (a:as) = pure (fromText a, as)

main :: IO ()
main = do
  args <- arguments
  (srcBase, _) <- getBasePath args
  targetBase <- pwd
  sequence_ $ runTarget srcBase targetBase <$> targets
