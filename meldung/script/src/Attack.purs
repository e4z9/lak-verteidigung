module Data.Attack
  (Attack(..)
  , AttackDay
  , AttackTime
  , AttackDateTime
  , fromString)
  where

import Control.MonadZero (guard)
import Data.Array (some, many) as A
import Data.Either (either)
import Data.Int (fromString) as I
import Data.Maybe (Maybe(..), isJust, fromMaybe)
import Data.Ord ((>=), (<=))
import Data.String (fromCharArray) as S
import Prelude (bind, (<$>), pure, ($), const, (&&))
import Text.Parsing.Parser (Parser, runParser)
import Text.Parsing.Parser.Combinators (optional)
import Text.Parsing.Parser.String (oneOf, char, noneOf)

newtype AttackDay = AttackDay { day :: Int
                                , month :: Int
                                , year :: Int }
newtype AttackTime = AttackTime { hour :: Int
                                , minute :: Int }
newtype AttackDateTime = AttackDateTime { day :: AttackDay
                                        , time :: AttackTime }
newtype Attack = Attack { castleName :: String
                        , castleLink :: String
                        , bridgeLink :: String
                        , dateTime :: AttackDateTime }

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

bounded :: Int -> Int -> ParserS Int
bounded min max = do
  d <- positiveInt
  guard (d >= min && d <= max)
  pure d

date :: ParserS AttackDay
date = do
  d <- bounded 1 31
  char '.'
  m <- bounded 1 12
  char '.'
  y <- positiveInt
  pure $ AttackDay { day: d, month: m, year: y }

time :: ParserS AttackTime
time = do
  h <- bounded 0 23
  char ':'
  m <- bounded 0 59
  pure $ AttackTime { hour: h, minute: m }

attack :: ParserS Attack
attack = do
  many $ noneOf [':']
  char ':'
  spaces
  name <- toEOL1
  spaces
  link <- toEOL1
  spaces
  bridge <- toEOL1
  many $ noneOf [':']
  char ':'
  spaces
  d <- date
  optional $ char ',' -- ',' only on iOS
  spaces
  t <- time
  pure $ Attack { castleName: name, castleLink: link, bridgeLink: bridge, dateTime: (AttackDateTime { day: d, time: t }) }

fromString :: String -> Maybe Attack
fromString s = either (const Nothing) Just $ runParser s attack
