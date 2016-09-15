module Data.Attack (CastleName
  , CastleLink
  , BridgeLink
  , Attack(..)
  , fromString) where

import Control.MonadZero (guard)
import Data.Array (some, many) as A
import Data.Bounded (bottom)
import Data.DateTime (DateTime(..), Date, Day, Month, Year, canonicalDate, Time(..), Hour, Minute, Second, Millisecond)
import Data.Either (either)
import Data.Enum (class BoundedEnum, toEnum)
import Data.Int (fromString) as I
import Data.Maybe (Maybe(..), isJust, fromMaybe)
import Data.String (fromCharArray) as S
import Prelude (bind, (<$>), pure, ($), const)
import Text.Parsing.Parser (Parser, runParser)
import Text.Parsing.Parser.Combinators ((<?>))
import Text.Parsing.Parser.String (oneOf, char, string, noneOf)

type CastleName = String
type CastleLink = String
type BridgeLink = String

data Attack = Attack CastleName CastleLink BridgeLink DateTime

type ParserS a = Parser String a

some :: ParserS Char -> ParserS String
some c = S.fromCharArray <$> A.some c

many :: ParserS Char -> ParserS String
many c = S.fromCharArray <$> A.many c

digit :: ParserS Char
digit = oneOf ['0','1','2','3','4','5','6','7','8','9']

spaces :: ParserS String
spaces = many $ oneOf [' ', '\t', '\r', '\n']

toEOL1 :: ParserS String
toEOL1 = some $ noneOf ['\n']

positiveInt :: ParserS Int
positiveInt = do
  iStr <- some digit
  let i :: Maybe Int
      i = I.fromString iStr
  guard (isJust i)
  pure $ fromMaybe 0 i

enum :: forall a. (BoundedEnum a) => ParserS a
enum = do
  d <- positiveInt
  let maybeDay = toEnum d :: Maybe a
  guard (isJust maybeDay)
  pure $ fromMaybe (bottom :: a) maybeDay

date :: ParserS Date
date = do
  d <- (enum :: ParserS Day)
  char '.'
  m <- (enum :: ParserS Month)
  char '.'
  y <- (enum :: ParserS Year)
  pure $ canonicalDate y m d

time :: ParserS Time
time = do
  h <- (enum :: ParserS Hour)
  char ':'
  m <- (enum :: ParserS Minute)
  pure $ Time h m (bottom :: Second) (bottom :: Millisecond)

attack :: ParserS Attack
attack = do
  string "Burg: "
  name <- toEOL1
  spaces
  link <- toEOL1
  spaces
  bridge <- toEOL1
  many $ noneOf [':']
  char ':'
  spaces
  d <- date
  char ','
  spaces
  t <- time
  pure $ Attack name link bridge (DateTime d t)

fromString :: String -> Maybe Attack
fromString s = either (const Nothing) Just $ runParser s attack
