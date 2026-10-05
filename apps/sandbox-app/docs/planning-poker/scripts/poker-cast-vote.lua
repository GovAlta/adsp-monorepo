-- Casts (or changes) a participant's vote in the current round.
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId, roundId, userId, userName, vote
-- Output: the roundId the vote was cast in.
--
-- The vote is stored in the value service, which players cannot read. The vote-cast event only
-- says who voted, so the number stays hidden until poker-reveal runs.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
-- User IDs are emails, which can be up to 254 characters.
local MAX_USER_ID_LENGTH = 254
local MAX_NAME_LENGTH = 100
local MAX_VOTE_LENGTH = 10
local DECK = {
  ['0'] = true, ['1'] = true, ['2'] = true, ['3'] = true, ['5'] = true,
  ['8'] = true, ['13'] = true, ['21'] = true, ['?'] = true, ['coffee'] = true,
}

-- Script inputs arrive as a .NET dictionary; check the key first so a missing input reads as nil.
local function readInput(name, maxLength)
  if not inputs:ContainsKey(name) or inputs[name] == nil then
    return nil
  end
  local value = tostring(inputs[name])
  if string.len(value) > maxLength then
    error(name .. ' must be ' .. maxLength .. ' characters or less.')
  end
  return value
end

local function requireInput(name, maxLength)
  local value = readInput(name, maxLength)
  if value == nil or value == '' then
    error(name .. ' is required.')
  end
  return value
end

local function sendEvent(name, sessionId, payload)
  if not adsp.SendDomainEvent(NAMESPACE, name, sessionId, { sessionId = sessionId }, payload) then
    error('Failed to send ' .. name .. ' event.')
  end
end

-- Values read back from the value service are .NET dictionaries and lists, not Lua tables.
local function field(dictionary, key)
  if dictionary == nil or not dictionary:ContainsKey(key) then
    return nil
  end
  local value = dictionary[key]
  -- Stored strings that look like dates are parsed into .NET DateTime on read; return them as ISO text.
  if type(value) == 'userdata' and value:GetType().Name == 'DateTime' then
    return value:ToString('o')
  end
  return value
end

local function readCurrentRound(sessionId)
  local result = adsp.ReadValue(NAMESPACE, 'round-' .. sessionId, 1)
  local entries = field(field(result, NAMESPACE), 'round-' .. sessionId)
  if entries == nil or entries.Count == 0 then
    return nil
  end
  return field(entries[0], 'value')
end

local sessionId = requireInput('sessionId', MAX_ID_LENGTH)
local ballot = {
  sessionId = sessionId,
  roundId = requireInput('roundId', MAX_ID_LENGTH),
  userId = requireInput('userId', MAX_USER_ID_LENGTH),
  userName = requireInput('userName', MAX_NAME_LENGTH),
}
local vote = requireInput('vote', MAX_VOTE_LENGTH)
-- A vote sent as a JSON number arrives as a decimal (e.g. 8.0); match it to the card text.
local points = tonumber(vote)
if points ~= nil and points == math.floor(points) then
  vote = string.format('%d', points)
end
if not DECK[vote] then
  error('Vote ' .. vote .. ' is not a card in the deck.')
end

local round = readCurrentRound(sessionId)
if field(round, 'roundId') ~= ballot.roundId or field(round, 'status') ~= 'voting' then
  error('Round ' .. ballot.roundId .. ' is not open for voting.')
end

-- Each vote is appended; the newest entry per user wins, so changing a vote is just voting again.
adsp.WriteValue(NAMESPACE, 'votes-' .. ballot.roundId, {
  value = {
    sessionId = sessionId,
    roundId = ballot.roundId,
    userId = ballot.userId,
    userName = ballot.userName,
    vote = vote,
  },
  context = { sessionId = sessionId, roundId = ballot.roundId },
  correlationId = ballot.roundId,
})

sendEvent('vote-cast', sessionId, ballot)

return ballot.roundId
