# TideChart

This app gets the tide information for any city added (for which the tide information is available).  Once the city is secected, the table counts down the amount of time until the next tide.  The user can delete any city before the tide exipres.  Once the tide expires, the page continues to display "time since last tide".  The user can "refresh" the information for the city, which will display the next tide information.

Some key technologies deployed here:
1.  Since I needed and EXACT match for city/state information, I used Google Places to autocomplete the location.
2.  Tide information is only available within the USA, so I had to check and Alert to any locations that were outside the country.
3.  Likewise, tide information is only available for cities that actually have tides!  So I Alert back to the user when the API call results in no tide information.
4.  Once I detect that the tide has expired, I wanted to give the user the ability to either leave the page as is (in case they wanted to know how long since the last tide), or refresh to get the next tide information.
5.  The API call to Weather Underground returns all atmospheric information in the order of next events.  So for example, calling it in the afternoon, it might return "Sunset" information if the sunset occures before the next tide.  So I have to grab a lot of data, then search until I find either "Hi Tide" or "Low Tide".  Then I store that information, along with what actual tide it is. 
6.  I only store the NEXT tide.  This way, whenever the user presses "refresh", I'm always going out and getting one tide.  In the case the multiple tides expire before a refresh, it would be a nightmare for me to figure out if I already had the next tide in the database or if I needed to go fetch it.  In my case, I always go fetch.

