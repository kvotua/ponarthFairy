using UnityEngine;

public class PlayerWalking : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    [SerializeField] public static float _maxPlayerSpeed = 8f;
    [SerializeField] public static float _playerAccelaration = 0.2f;
    private float _playerSpeed;
    private Vector3 _movementDirection;
    private Rigidbody _Rigidbody;
    void Start()
    {
        _Rigidbody = GetComponent<Rigidbody>();
    }

    // Update is called once per frame
    void Update()
    {
        _movementDirection = new Vector3(Input.GetAxis("Vertical") * -1, 0, Input.GetAxis("Horizontal")); 
        _Rigidbody.transform.position += _movementDirection * _playerSpeed * Time.deltaTime;
    }

    private void FixedUpdate()
    {
        if (Input.anyKey == true) _playerSpeed += _maxPlayerSpeed > _playerSpeed ? _playerAccelaration : 0;
        else _playerSpeed -= _playerSpeed > 0 ? _playerAccelaration : 0;
    }

}
