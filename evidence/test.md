# 1st Test

Using correct data

origin : PIT
destination : KTM
outbound_date : 2027-02-05
return_date : 2027-03-20
budget : 2000

It ran succesfully.

# 2nd Test 

Using contradictory dates, return before departure

origin : PIT
destination : KTM
outbound_date : 2027-02-05
return_date : 2027-1-20
budget : 2000

The execution goes through the if node and the false triggers the "Needs Review"

# 3rd Test

Using valid data again

origin : PIT
destination : KTM
outbound_date : 2027-02-05
return_date : 2027-04-10
budget : 2000

The workflow still triggered false and i fixed it by changing condition in if statement to "matches regex"

The workflow executed to the end with no issue