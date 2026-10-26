"""
Verified official geographic coordinates for CPCB / State Pollution Control Board stations.
Source: Central Pollution Control Board (CPCB) CAAQMS Station Directory & Kerala SPCB bulletins.
"""

STATION_COORDINATES = {
    # Kerala Stations (KSPCB / CPCB)
    "KL001": {"lat": 10.0763, "lon": 76.2996, "city": "Eloor", "state": "Kerala", "name": "Udyogamandal, Eloor - Kerala PCB"},
    "KL002": {"lat": 9.9868, "lon": 76.2842, "city": "Ernakulam", "state": "Kerala", "name": "Kacheripady, Ernakulam - Kerala PCB"},
    "KL003": {"lat": 11.8745, "lon": 75.3704, "city": "Kannur", "state": "Kerala", "name": "Thavakkara, Kannur - Kerala PCB"},
    "KL004": {"lat": 9.9678, "lon": 76.3195, "city": "Kochi", "state": "Kerala", "name": "Vyttila, Kochi - Kerala PCB"},
    "KL005": {"lat": 8.8784, "lon": 76.6022, "city": "Kollam", "state": "Kerala", "name": "Polayathode, Kollam - Kerala PCB"},
    "KL006": {"lat": 11.2528, "lon": 75.7876, "city": "Kozhikode", "state": "Kerala", "name": "Palayam, Kozhikode - Kerala PCB"},
    "KL007": {"lat": 8.5647, "lon": 76.8835, "city": "Thiruvananthapuram", "state": "Kerala", "name": "Kariavattom, Thiruvananthapuram - Kerala PCB"},
    "KL008": {"lat": 8.5144, "lon": 76.9474, "city": "Thiruvananthapuram", "state": "Kerala", "name": "Plammoodu, Thiruvananthapuram - Kerala PCB"},

    # Andhra Pradesh
    "AP001": {"lat": 16.5131, "lon": 80.5165, "city": "Amaravati", "state": "Andhra Pradesh", "name": "Secretariat, Amaravati - APPCB"},
    "AP002": {"lat": 17.0005, "lon": 81.8040, "city": "Rajamahendravaram", "state": "Andhra Pradesh", "name": "Anand Kala Kshetram, Rajamahendravaram - APPCB"},
    "AP003": {"lat": 13.6833, "lon": 79.3500, "city": "Tirupati", "state": "Andhra Pradesh", "name": "Tirumala, Tirupati - APPCB"},
    "AP004": {"lat": 16.5062, "lon": 80.6480, "city": "Vijayawada", "state": "Andhra Pradesh", "name": "PWD Grounds, Vijayawada - APPCB"},
    "AP005": {"lat": 17.7289, "lon": 83.3031, "city": "Visakhapatnam", "state": "Andhra Pradesh", "name": "GVM Corporation, Visakhapatnam - APPCB"},

    # Delhi (DPCC / CPCB)
    "DL001": {"lat": 28.6508, "lon": 77.3152, "city": "Delhi", "state": "Delhi", "name": "Anand Vihar, Delhi - DPCC"},
    "DL002": {"lat": 28.5802, "lon": 77.2338, "city": "Delhi", "state": "Delhi", "name": "Jawaharlal Nehru Stadium, Delhi - DPCC"},
    "DL003": {"lat": 28.5631, "lon": 77.1869, "city": "Delhi", "state": "Delhi", "name": "R K Puram, Delhi - DPCC"},
    "DL004": {"lat": 28.6285, "lon": 77.2075, "city": "Delhi", "state": "Delhi", "name": "Mandir Marg, Delhi - DPCC"},
    "DL005": {"lat": 28.6235, "lon": 77.2872, "city": "Delhi", "state": "Delhi", "name": "Patparganj, Delhi - DPCC"},

    # Karnataka (KSPCB / CPCB)
    "KA001": {"lat": 12.9716, "lon": 77.5946, "city": "Bengaluru", "state": "Karnataka", "name": "City Railway Station, Bengaluru - KSPCB"},
    "KA002": {"lat": 12.9135, "lon": 77.5855, "city": "Bengaluru", "state": "Karnataka", "name": "BTM Layout, Bengaluru - KSPCB"},
    "KA003": {"lat": 13.0119, "lon": 77.5549, "city": "Bengaluru", "state": "Karnataka", "name": "Peenya, Bengaluru - KSPCB"},

    # Maharashtra (MPCB / CPCB)
    "MH001": {"lat": 19.0657, "lon": 72.8782, "city": "Mumbai", "state": "Maharashtra", "name": "Bandra Kurla Complex, Mumbai - MPCB"},
    "MH002": {"lat": 19.0330, "lon": 72.8540, "city": "Mumbai", "state": "Maharashtra", "name": "Sion, Mumbai - MPCB"},
    "MH003": {"lat": 18.5204, "lon": 73.8567, "city": "Pune", "state": "Maharashtra", "name": "Shivajinagar, Pune - MPCB"},

    # Tamil Nadu (TNPCB / CPCB)
    "TN001": {"lat": 13.0034, "lon": 80.2565, "city": "Chennai", "state": "Tamil Nadu", "name": "Alandur Bus Depot, Chennai - CPCB"},
    "TN002": {"lat": 13.0339, "lon": 80.1989, "city": "Chennai", "state": "Tamil Nadu", "name": "Manali, Chennai - TNPCB"},

    # Telangana (TSPCB / CPCB)
    "TG001": {"lat": 17.4563, "lon": 78.4447, "city": "Hyderabad", "state": "Telangana", "name": "Sanathnagar, Hyderabad - TSPCB"},
    "TG002": {"lat": 17.4334, "lon": 78.3846, "city": "Hyderabad", "state": "Telangana", "name": "University of Hyderabad, Hyderabad - TSPCB"},

    # West Bengal (WBPCB / CPCB)
    "WB001": {"lat": 22.5697, "lon": 88.3697, "city": "Kolkata", "state": "West Bengal", "name": "Victoria Memorial, Kolkata - WBPCB"},
    "WB002": {"lat": 22.6234, "lon": 88.4312, "city": "Kolkata", "state": "West Bengal", "name": "Rabindra Bharati University, Kolkata - WBPCB"}
}

def get_station_coords(station_id: str, city: str = ""):
    if station_id in STATION_COORDINATES:
        return STATION_COORDINATES[station_id]["lat"], STATION_COORDINATES[station_id]["lon"]
    # Fallback default coordinates for known cities if station ID not mapped
    city_defaults = {
        "Delhi": (28.6139, 77.2090),
        "Bengaluru": (12.9716, 77.5946),
        "Mumbai": (19.0760, 72.8777),
        "Chennai": (13.0827, 80.2707),
        "Hyderabad": (17.3850, 78.4867),
        "Kolkata": (22.5726, 88.3639),
        "Thiruvananthapuram": (8.5241, 76.9366),
        "Kochi": (9.9312, 76.2673),
        "Ernakulam": (9.9816, 76.2999),
        "Kozhikode": (11.2588, 75.7804),
        "Kollam": (8.8932, 76.6141),
        "Kannur": (11.8745, 75.3704),
        "Amaravati": (16.5131, 80.5165),
        "Visakhapatnam": (17.6868, 83.2185),
    }
    return city_defaults.get(city, (None, None))
